'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase/clientApp';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  MapPin,
  DollarSign,
  Bed,
  Image as ImageIcon,
  Home,
  Check,
  X,
  ArrowLeft,
  ChevronRight,
  Bath,
  Car,
  Sparkles,
  Video,
} from 'lucide-react';

const STEPS = {
  ADDRESS: 1,
  TYPE: 2,
  PRICE: 3,
  DETAILS: 4,
  IMAGES: 5,
  TITLE: 6,
  SUBMIT: 7,
};

const homeTypes = ['House', 'Apartment', 'Villa', 'Townhouse', 'Acreage'];
const homeFeatures = [
  'Pool', 'Granny Flat', 'Solar', 'Air Conditioning',
  'Outdoor Entertainment Area', 'Garage / Secure Parking',
  'Study', 'Ensuite', 'Smart Home Features', 'Built-in Wardrobes',
];

export default function AddPropertyPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const autocompleteRef = useRef(null);

  const [step, setStep] = useState(STEPS.ADDRESS);

  // Property fields
  const [formattedAddress, setFormattedAddress] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [type, setType] = useState(null);
  const [priceRaw, setPriceRaw] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [carSpaces, setCarSpaces] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [features, setFeatures] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);

  // UX state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/join');
    }
  }, [user, authLoading, router]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((f) => {
        if (typeof f !== 'string' && f?.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, [images]);

  const videoPreviewUrl = useMemo(() => {
    if (!video) return null;
    return URL.createObjectURL(video);
  }, [video]);

  const formattedPrice = useMemo(() => {
    if (!priceRaw) return '';
    try {
      return Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        maximumFractionDigits: 0,
      }).format(Number(priceRaw));
    } catch {
      return '';
    }
  }, [priceRaw]);

  const handlePlaceChanged = () => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const fullFormatted = place?.formatted_address || '';
    const lat = place?.geometry?.location?.lat?.();
    const lng = place?.geometry?.location?.lng?.();

    let areaAddress = '';
    if (place?.address_components) {
      const components = place.address_components;
      const suburb = components.find((c) => c.types.includes('locality'))?.long_name || '';
      const state = components.find((c) => c.types.includes('administrative_area_level_1'))?.short_name || '';
      const country = components.find((c) => c.types.includes('country'))?.long_name || '';
      areaAddress = [suburb, state, country].filter(Boolean).join(' ');
    }

    setAddress(areaAddress || '');
    setFormattedAddress(fullFormatted || '');
    if (lat && lng) {
      setLocation({ latitude: lat, longitude: lng });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => {
      const f = file;
      f.preview = URL.createObjectURL(file);
      return f;
    });
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const newImages = [...prev];
      const removed = newImages.splice(index, 1)[0];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return newImages;
    });
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setVideo(file);
  };

  const removeVideo = () => {
    setVideo(null);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const selectedFeatures = Object.keys(features).filter((f) => features[f]);
      const res = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: homeTypes[type - 1],
          address,
          bedrooms,
          bathrooms,
          squareFeatures: squareFootage,
          features: selectedFeatures,
          price: priceRaw,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFeature = (feature) => {
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  // Validation
  const validateStep = () => {
    const newErrors = {};

    if (step === STEPS.ADDRESS) {
      if (!address || !location?.latitude || !location?.longitude) {
        newErrors.step = 'Please select a valid address from suggestions.';
      }
    }
    if (step === STEPS.TYPE && !type) {
      newErrors.step = 'Please select a property type.';
    }
    if (step === STEPS.PRICE && !priceRaw) {
      newErrors.step = 'Please enter an expected price.';
    }
    if (step === STEPS.DETAILS) {
      if (!bedrooms || !bathrooms || !carSpaces) {
        newErrors.step = 'Please add bedrooms, bathrooms and car spaces.';
      }
    }
    if (step === STEPS.IMAGES && images.length === 0) {
      newErrors.step = 'Please upload at least one image.';
    }
    if (step === STEPS.TITLE && !title.trim()) {
      newErrors.step = 'Please enter a title for the listing.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNext = () => {
    setErrors({});
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const onBack = () => {
    if (step > STEPS.ADDRESS) {
      setErrors({});
      setStep((s) => s - 1);
    }
  };

  // Submit
  const handleSubmit = async () => {
    setErrors({});
    if (!validateStep()) return;
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Create property doc first
      const initialData = {
        createdAt: serverTimestamp(),
        offPlan: false,
        priceHistory: [],
        showPriceRange: false,
        active: true,
        isEager: 80,
        wantsPremiumListing: false,
        agent: true,
        userId: user.uid,
        visibility: false,
      };

      const docRef = await addDoc(collection(db, 'properties'), initialData);
      const propertyId = docRef.id;

      // Upload images
      const total = images.length;
      const imageUrls = [];

      await updateDoc(doc(db, 'properties', propertyId), {
        imageUploadProgress: { uploaded: 0, total, inProgress: total > 0 },
      });

      for (let i = 0; i < total; i++) {
        const file = images[i];
        const storageRef = ref(storage, `propertyImages/${user.uid}/${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            reject,
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              imageUrls.push(downloadURL);
              await updateDoc(doc(db, 'properties', propertyId), {
                imageUploadProgress: {
                  uploaded: imageUrls.length,
                  total,
                  inProgress: imageUrls.length < total,
                },
              });
              resolve();
            }
          );
        });
      }

      // Upload video to Bunny CDN if provided
      let videoUrl = null;
      if (video) {
        const videoFormData = new FormData();
        videoFormData.append('file', video);
        const videoRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: videoFormData,
        });
        if (videoRes.ok) {
          const videoData = await videoRes.json();
          videoUrl = videoData.url;
        }
      }

      // Update with full data
      const propertyData = {
        address,
        formattedAddress,
        bathrooms,
        bedrooms,
        carSpaces,
        createdAt: serverTimestamp(),
        description,
        imageUrls,
        imageUploadProgress: { uploaded: total, total, inProgress: false },
        features: Object.keys(features).filter((f) => features[f]),
        location,
        offPlan: false,
        postcode: '',
        priceHistory: [],
        price: priceRaw,
        toPrice: null,
        showPriceRange: false,
        squareFootage,
        title,
        active: true,
        visibility: false,
        acceptingOffers: true,
        campaignId: 'FqMZd0mWlNlSBl66s7BN',
        isEager: 80,
        propertyType: type,
        wantsPremiumListing: false,
        agent: true,
        vendorUploaded: true,
        agentManaged: true,
        userId: user.uid,
        stats: { views: 0 },
        ...(videoUrl && { videoUrl }),
      };

      await updateDoc(doc(db, 'properties', propertyId), propertyData);
      await setDoc(doc(db, 'draftProperties', propertyId), { ...propertyData, override: true });

      // Create notification
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      await addDoc(collection(db, 'notifications'), {
        property: propertyData,
        createdAt: new Date(),
        read: false,
        type: 'newProspect',
        user: userSnap.data(),
      });

      router.push('/dashboard');
    } catch (err) {
      console.error('Submit failed:', err);
      setErrors({ step: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (!user) return null;

  const totalSteps = Object.keys(STEPS).length - 1; // Exclude SUBMIT step from progress
  const progressPercent = (Math.min(step, totalSteps) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => step === STEPS.ADDRESS ? router.push('/dashboard') : onBack()}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Add Property</h1>
                <p className="text-xs text-slate-500">Step {step} of {totalSteps}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#e48900] to-[#c64500]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Address */}
            {step === STEPS.ADDRESS && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Where is the property?</h2>
                <p className="text-slate-500 mb-6">Start typing and select from the suggestions.</p>

                <LoadScript
                  id="gmaps-script"
                  googleMapsApiKey="AIzaSyBbLrFWUU62O_by81ihAVKvye4bHA0sah8"
                  libraries={['places']}
                >
                  <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceChanged}>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="123 Main Street, Sydney NSW"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-lg"
                      />
                    </div>
                  </Autocomplete>
                </LoadScript>

                {address && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-sm text-orange-800"><strong>Selected:</strong> {formattedAddress}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Type */}
            {step === STEPS.TYPE && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Property type</h2>
                <p className="text-slate-500 mb-6">Choose the one that fits best.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {homeTypes.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setType(idx + 1)}
                      className={`px-6 py-4 rounded-xl text-lg font-medium transition-all border ${
                        type === idx + 1
                          ? 'bg-gradient-to-r from-[#e48900] to-[#c64500] text-white border-orange-500 shadow-lg'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:shadow-md'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Price */}
            {step === STEPS.PRICE && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Expected price</h2>
                <p className="text-slate-500 mb-6">Give us a ballpark figure.</p>

                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                  <input
                    type="text"
                    placeholder="750,000"
                    value={formattedPrice}
                    onChange={(e) => {
                      const numeric = (e.target.value || '').replace(/\D/g, '');
                      setPriceRaw(numeric);
                    }}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-2xl font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Details */}
            {step === STEPS.DETAILS && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Property details</h2>
                <p className="text-slate-500 mb-6">The basic details.</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Bedrooms</label>
                      <input
                        type="number"
                        placeholder="3"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Bathrooms</label>
                      <input
                        type="number"
                        placeholder="2"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Car Spaces</label>
                      <input
                        type="number"
                        placeholder="2"
                        value={carSpaces}
                        onChange={(e) => setCarSpaces(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Land Size (sqm) - Optional</label>
                    <input
                      type="number"
                      placeholder="450"
                      value={squareFootage}
                      onChange={(e) => setSquareFootage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-lg"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-slate-700 mb-3">Features (Optional)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {homeFeatures.map((feature) => (
                        <button
                          key={feature}
                          onClick={() => toggleFeature(feature)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                            features[feature]
                              ? 'bg-gradient-to-r from-[#e48900] to-[#c64500] text-white border-orange-500'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300'
                          }`}
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Images */}
            {step === STEPS.IMAGES && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Property photos</h2>
                <p className="text-slate-500 mb-6">Upload images of the property.</p>

                <label htmlFor="images" className="cursor-pointer">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-orange-400 hover:bg-orange-50 transition-all">
                    <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-base font-semibold text-slate-900 mb-1">Click to upload images</p>
                    <p className="text-sm text-slate-500">JPG, PNG up to 10MB each</p>
                  </div>
                  <input
                    type="file"
                    id="images"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {images.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-slate-700 mb-3">{images.length} image(s)</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {images.map((img, i) => {
                        const src = typeof img === 'string' ? img : img?.preview;
                        if (!src) return null;
                        return (
                          <div key={i} className="relative group">
                            <Image
                              src={src}
                              width={200}
                              height={200}
                              className="w-full h-28 object-cover rounded-xl border border-slate-200"
                              alt={`upload-${i}`}
                            />
                            <button
                              onClick={() => removeImage(i)}
                              className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Video Upload */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Walkthrough video</h3>
                  <p className="text-slate-500 text-sm mb-4">Upload a walkthrough video (optional)</p>

                  {!video ? (
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-orange-400 hover:bg-orange-50 transition-all">
                        <Video className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                        <p className="text-base font-semibold text-slate-900 mb-1">Click to upload video</p>
                        <p className="text-sm text-slate-500">MP4, MOV, WebM up to 500MB</p>
                      </div>
                      <input
                        type="file"
                        id="video-upload"
                        accept="video/mp4,video/quicktime,video/webm"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black">
                      <video
                        src={videoPreviewUrl}
                        controls
                        playsInline
                        className="w-full max-h-64 rounded-xl"
                      />
                      <button
                        onClick={removeVideo}
                        className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Title & Description */}
            {step === STEPS.TITLE && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">Listing details</h2>
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                  >
                    <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
                <p className="text-slate-500 mb-6">Add a title and description, or let AI generate them for you.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="Beautiful family home in..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description (Optional)</label>
                    <textarea
                      placeholder="Describe the property..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {errors.step && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-center"
              >
                <p className="text-red-700 text-sm font-medium">{errors.step}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-slate-200 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            {step > STEPS.ADDRESS ? (
              <button
                onClick={onBack}
                className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.TITLE ? (
              <button
                onClick={onNext}
                className="px-8 py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Property'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Uploading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-10 shadow-2xl text-center max-w-md mx-4">
            <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Uploading property...</h2>
            <p className="text-slate-500 text-sm">Please wait while we save your listing and upload images.</p>
          </div>
        </div>
      )}
    </div>
  );
}
