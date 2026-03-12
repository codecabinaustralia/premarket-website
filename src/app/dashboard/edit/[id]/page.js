'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { db, storage } from '../../../firebase/clientApp';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
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
};

const homeTypes = ['House', 'Apartment', 'Villa', 'Townhouse', 'Acreage'];
const homeFeatures = [
  'Pool', 'Granny Flat', 'Solar', 'Air Conditioning',
  'Outdoor Entertainment Area', 'Garage / Secure Parking',
  'Study', 'Ensuite', 'Smart Home Features', 'Built-in Wardrobes',
];

export default function EditPropertyPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id;
  const autocompleteRef = useRef(null);

  const [step, setStep] = useState(STEPS.ADDRESS);
  const [pageLoading, setPageLoading] = useState(true);

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
  // Images: mix of existing URL strings and new File objects
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null); // new File to upload
  const [existingVideoUrl, setExistingVideoUrl] = useState(null);

  // UX state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/join');
    }
  }, [user, authLoading, router]);

  // Load property data
  useEffect(() => {
    if (!user || !propertyId) return;

    const loadProperty = async () => {
      setPageLoading(true);
      try {
        const snap = await getDoc(doc(db, 'properties', propertyId));
        if (!snap.exists()) {
          router.push('/dashboard');
          return;
        }
        const p = snap.data();

        // Verify ownership
        if (p.userId !== user.uid) {
          router.push('/dashboard');
          return;
        }

        setFormattedAddress(p.formattedAddress || '');
        setAddress(p.address || '');
        setLocation(p.location || null);
        setType(p.propertyType || null);
        setPriceRaw(String(p.price || '').replace(/[^0-9]/g, ''));
        setBedrooms(p.bedrooms != null ? String(p.bedrooms) : '');
        setBathrooms(p.bathrooms != null ? String(p.bathrooms) : '');
        setCarSpaces(p.carSpaces != null ? String(p.carSpaces) : '');
        setSquareFootage(p.squareFootage != null ? String(p.squareFootage) : '');
        setTitle(p.title || '');
        setDescription(p.description || '');

        // Features as object
        const featObj = {};
        (p.features || []).forEach(f => { featObj[f] = true; });
        setFeatures(featObj);

        // Existing images as URL strings
        setImages(p.imageUrls || []);

        // Existing video
        setExistingVideoUrl(p.videoUrl || p.aiVideo?.url || null);
      } catch (err) {
        console.error('Error loading property:', err);
        router.push('/dashboard');
      } finally {
        setPageLoading(false);
      }
    };
    loadProperty();
  }, [user, propertyId, router]);

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

  const [mediaDragging, setMediaDragging] = useState(false);

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files || []);
    processMediaFiles(files);
  };

  const processMediaFiles = (files) => {
    setMediaError(null);
    const allowedVideoExts = ['.mp4', '.mov', '.webm', '.m4v'];
    const imageFiles = [];
    let videoFile = null;

    for (const f of files) {
      const ext = (f.name || '').toLowerCase().replace(/.*(\.\w+)$/, '$1');
      const isVideo = f.type.startsWith('video/') || allowedVideoExts.includes(ext);
      const isImage = f.type.startsWith('image/') || ext === '.heic' || ext === '.heif';

      if (isVideo) {
        if (f.size > 500 * 1024 * 1024) {
          setMediaError('Video file exceeds 500MB limit. Please choose a smaller file.');
          continue;
        }
        if (!allowedVideoExts.includes(ext)) {
          setMediaError(`Unsupported video format "${ext}". Please use MP4, MOV, WebM, or M4V.`);
          continue;
        }
        videoFile = f;
      } else if (isImage) {
        try {
          f.preview = URL.createObjectURL(f);
        } catch {
          f.preview = null;
        }
        imageFiles.push(f);
      }
    }

    if (imageFiles.length) setImages((prev) => [...prev, ...imageFiles]);
    if (videoFile) {
      setVideo(videoFile);
      setExistingVideoUrl(null);
    }
  };

  const handleMediaDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMediaDragging(false);
    processMediaFiles(Array.from(e.dataTransfer.files));
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const newImages = [...prev];
      const removed = newImages.splice(index, 1)[0];
      if (typeof removed !== 'string' && removed?.preview) URL.revokeObjectURL(removed.preview);
      return newImages;
    });
  };

  const removeVideo = () => {
    setVideo(null);
    setExistingVideoUrl(null);
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

  // Submit — update existing property
  // Background upload helper
  const uploadMediaInBackground = async (propId, userId, newFiles, existingUrls, videoFile, existingVidUrl) => {
    const uploadedUrls = [...existingUrls];

    try {
      for (const file of newFiles) {
        const storageRef = ref(storage, `propertyImages/${userId}/${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            reject,
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedUrls.push(downloadURL);
              await updateDoc(doc(db, 'properties', propId), {
                imageUrls: [...uploadedUrls],
                imageUploadProgress: {
                  uploaded: uploadedUrls.length - existingUrls.length,
                  total: newFiles.length,
                  inProgress: (uploadedUrls.length - existingUrls.length) < newFiles.length,
                },
              });
              resolve();
            }
          );
        });
      }

      // Upload new video
      if (videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('file', videoFile);
        const videoRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: videoFormData,
        });
        if (videoRes.ok) {
          const videoData = await videoRes.json();
          await updateDoc(doc(db, 'properties', propId), { videoUrl: videoData.url });
        }
      }

      // Mark complete
      if (newFiles.length > 0) {
        await updateDoc(doc(db, 'properties', propId), {
          imageUploadProgress: { uploaded: newFiles.length, total: newFiles.length, inProgress: false },
        });
      }
    } catch (err) {
      console.error('Background upload failed:', err);
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!validateStep()) return;
    if (!user) return;

    try {
      setIsSubmitting(true);

      const existingUrls = images.filter(img => typeof img === 'string');
      const newFiles = images.filter(img => typeof img !== 'string');
      const hasNewMedia = newFiles.length > 0 || (video && !existingVideoUrl);

      // Save metadata immediately (with existing images, new ones added in background)
      const updateData = {
        address,
        formattedAddress,
        bathrooms,
        bedrooms,
        carSpaces,
        description,
        imageUrls: existingUrls,
        features: Object.keys(features).filter((f) => features[f]),
        location,
        price: priceRaw,
        squareFootage,
        title,
        propertyType: type,
        updatedAt: serverTimestamp(),
        ...(existingVideoUrl ? { videoUrl: existingVideoUrl } : !video ? { videoUrl: null } : {}),
        ...(newFiles.length > 0 && {
          imageUploadProgress: { uploaded: 0, total: newFiles.length, inProgress: true },
        }),
      };

      await updateDoc(doc(db, 'properties', propertyId), updateData);
      await setDoc(doc(db, 'draftProperties', propertyId), { ...updateData, override: true }, { merge: true });

      // Kick off background upload if there are new files
      if (hasNewMedia) {
        const filesCopy = [...newFiles];
        const videoCopy = video;
        uploadMediaInBackground(propertyId, user.uid, filesCopy, existingUrls, videoCopy, existingVideoUrl);
      }

      // Redirect immediately
      router.push(`/dashboard?updated=1`);
    } catch (err) {
      console.error('Update failed:', err);
      setErrors({ step: 'Something went wrong. Please try again.' });
      setIsSubmitting(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (!user) return null;

  const totalSteps = Object.keys(STEPS).length;
  const progressPercent = (Math.min(step, totalSteps) / totalSteps) * 100;

  const hasVideo = video || existingVideoUrl;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => step === STEPS.ADDRESS ? router.push(`/dashboard/property/${propertyId}`) : onBack()}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Edit Property</h1>
                <p className="text-xs text-slate-500">Step {step} of {totalSteps}</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/dashboard/property/${propertyId}`)}
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
                        defaultValue={formattedAddress}
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

            {/* Step 5: Media */}
            {step === STEPS.IMAGES && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Add media</h2>
                <p className="text-slate-500 mb-6">Photos and an optional walkthrough video to showcase your property.</p>

                {/* Unified drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setMediaDragging(true); }}
                  onDragLeave={() => setMediaDragging(false)}
                  onDrop={handleMediaDrop}
                  onClick={() => document.getElementById('media-upload').click()}
                  className={`relative rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${mediaDragging ? 'bg-orange-50 border-2 border-orange-400 scale-[1.01]' : 'bg-slate-50 border-2 border-dashed border-slate-200 hover:bg-orange-50/50 hover:border-orange-300'}`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${mediaDragging ? 'bg-orange-100' : 'bg-slate-100'}`}>
                      <ImageIcon className={`w-7 h-7 ${mediaDragging ? 'text-orange-500' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {mediaDragging ? 'Drop files here' : 'Click or drag files to upload'}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">Images (JPG, PNG, HEIC) and video (MP4, MOV, WebM)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    id="media-upload"
                    accept="image/*,.heic,.heif,video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
                    multiple
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </div>

                {mediaError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                    <p className="text-sm text-red-600">{mediaError}</p>
                    <button onClick={() => setMediaError(null)}>
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}

                {/* Media grid — video first, then images */}
                {(hasVideo || images.length > 0) && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-slate-500">
                        {images.length} photo{images.length !== 1 ? 's' : ''}{hasVideo ? ' + 1 video' : ''}
                      </p>
                      <button
                        onClick={() => document.getElementById('media-upload').click()}
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        + Add more
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {/* Video thumbnail first */}
                      {hasVideo && (
                        <div className="relative group col-span-2 row-span-2">
                          <video
                            src={video ? videoPreviewUrl : existingVideoUrl}
                            className="w-full h-full min-h-[14rem] object-cover rounded-xl border border-slate-200"
                            muted
                            playsInline
                            onMouseOver={(e) => e.target.play()}
                            onMouseOut={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors" />
                          <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-lg flex items-center gap-1">
                            <Video className="w-3 h-3" /> Video
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeVideo(); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {/* Image thumbnails */}
                      {images.map((img, i) => {
                        const src = typeof img === 'string' ? img : img?.preview;
                        if (!src) return null;
                        return (
                          <div key={i} className="relative group aspect-square">
                            <Image
                              src={src}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover rounded-xl border border-slate-200"
                              alt={`upload-${i}`}
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors" />
                            <button
                              onClick={() => removeImage(i)}
                              className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Saving Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-10 shadow-2xl text-center max-w-md mx-4">
            <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Saving changes...</h2>
            <p className="text-slate-500 text-sm">This will only take a moment.</p>
          </div>
        </div>
      )}
    </div>
  );
}
