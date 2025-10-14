'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import { useModal } from '../context/ModalContext';
import { useSearchParams } from 'next/navigation';
import { storage, db } from '../firebase/clientApp';

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDocs,
  orderBy,
  limit,
  query,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const STEPS = {
  INTRO: 1,
  GOAL: 2,
  ADDRESS: 3,
  TYPE: 4,
  PRICE: 5,
  DETAILS: 6,
  IMAGES: 7,
  // TITLE_DESC: 8,
  ACCOUNT: 8,
  COMPLETE: 9,
};

export default function PropertyFormModal() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent');

  const autocompleteRef = useRef(null);
  const { showModal, setShowModal } = useModal();
  const isHidden = !showModal;

  // wizard
  const [step, setStep] = useState(STEPS.INTRO);

  // property + agent
  const [propertyId, setPropertyId] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [startDate, setStartDate] = useState(null);

  // contact
  const [clientName, setFullName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setPhone] = useState('');

  // choices
  const [type, setType] = useState(null);

  // location
  const [formattedAddress, setFormattedAddress] = useState(null);
  const [address, setAddress] = useState(null);
  const [location, setLocation] = useState(null);

  // numbers/details
  const [priceRaw, setPriceRaw] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [carSpaces, setCarSpaces] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [features, setFeatures] = useState({});

  // content
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // images
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ux
  const [errors, setErrors] = useState({});
  const [navLoading, setNavLoading] = useState(false);

  const [gotoMarketGoal, setGotoMarketGoal] = useState(null);


  const homeTypes = ['House', 'Apartment', 'Villa', 'Townhouse', 'Acreage'];
  const homeFeatures = [
    'Pool',
    'Granny Flat',
    'Solar',
    'Air Conditioning',
    'Outdoor Entertainment Area',
    'Garage / Secure Parking',
    'Study',
    'Ensuite',
    'Smart Home Features',
    'Built-in Wardrobes',
  ];

  const GOAL_OPTIONS = [
  { label: 'ASAP (I’m ready now!)', months: 1 },
  { label: 'Within the next 6 months', months: 6 },
  { label: 'Within 1 year', months: 12 },
  { label: 'Within 2 years', months: 24 },
  { label: 'Later than 2 years', months: 36 },
];


  // ---------- Effects ----------
  useEffect(() => {
    (async () => {
      if (!agentId) return;
      try {
        const docRef = doc(db, 'agents', agentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setAgentData({ id: docSnap.id, ...docSnap.data() });
      } catch (e) {
        console.error('Failed to load agent:', e);
      }
    })();
  }, [agentId]);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'campaigns'), orderBy('created', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const date = data.startDate?.toDate
            ? data.startDate.toDate()
            : data.startDate?.seconds
            ? new Date(data.startDate.seconds * 1000)
            : null;
          if (date) setStartDate(date);
        }
      } catch (e) {
        console.error('Failed to load campaign startDate:', e);
      }
    })();
  }, []);

  // keep email in sync with clientEmail initially
  useEffect(() => {
    if (clientEmail && !email) setEmail(clientEmail);
  }, [clientEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  // revoke object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((f) => {
        if (typeof f !== 'string' && f?.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, [images]);

  // ---------- Helpers ----------
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

  const toggleFeature = (feature) => {
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  const handlePlaceChanged = () => {
  const autocomplete = autocompleteRef.current;
  if (!autocomplete) return;

  const place = autocomplete.getPlace();
  const fullFormatted = place?.formatted_address || '';

  const lat = place?.geometry?.location?.lat?.();
  const lng = place?.geometry?.location?.lng?.();

  // Extract "area" from address_components
  let areaAddress = '';
  if (place?.address_components) {
    const components = place.address_components;
    const suburb = components.find(c => c.types.includes('locality'))?.long_name || '';
    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
    const country = components.find(c => c.types.includes('country'))?.long_name || '';
    areaAddress = [suburb, state, country].filter(Boolean).join(' ');
  }

  // Save both
  setAddress(areaAddress || null); // area only
  setFormattedAddress(fullFormatted || null); // full address

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

  const resetForm = () => {
    setStep(STEPS.INTRO);
    setPropertyId(null);
    setAddress(null);
    setType(null);
    setPriceRaw('');
    setBathrooms('');
    setBedrooms('');
    setCarSpaces('');
    setSquareFootage('');
    setTitle('');
    setDescription('');
    setLocation(null);
    setFeatures({});
    setImages([]);
    setEmail('');
    setPassword('');
    setErrors({});
    setGotoMarketGoal(null);
    setFullName('');
    setClientEmail('');
    setPhone('');
  };

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  // ---------- Validation ----------
  const validateStep = () => {
    const newErrors = {};

    if (step === STEPS.INTRO) {
      if (!clientName || !clientEmail || !clientPhone) {
        newErrors.step = 'Please fill in all fields';
      }
    }

    if (step === STEPS.GOAL) {
  if (!gotoMarketGoal?.date) {
    newErrors.step = 'Please choose a rough timeline.';
  }
}

    if (step === STEPS.ADDRESS) {
      if (!address || !location?.latitude || !location?.longitude) {
        newErrors.step = 'Please select a valid address from suggestions.';
      }
    }

    if (step === STEPS.TYPE && !type) {
      newErrors.step = 'Please select a property type.';
    }

    if (step === STEPS.PRICE && !priceRaw) {
      newErrors.step = 'Please enter your expected price.';
    }

    if (step === STEPS.DETAILS) {
      if (!bedrooms || !bathrooms || !carSpaces) {
        newErrors.step = 'Please add bedrooms, bathrooms and car spaces.';
      }
    }

    if (step === STEPS.IMAGES && images.length === 0) {
      newErrors.step = 'Please upload at least one image.';
    }

    if (step === STEPS.TITLE_DESC) {
      if (!title || !description) {
        newErrors.step = 'Please enter a title and description.';
      }
    }

    if (step === STEPS.ACCOUNT) {
      if (!email || !password) newErrors.step = 'Please enter an email and password.';
      else if (!email.includes('@')) newErrors.step = 'Please enter a valid email address.';
      else if (password.length < 6) newErrors.step = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Navigation ----------
  const handlePriorSubmitIfNeeded = async () => {
    // Create the property doc once on step 1 -> 2 transition
    if (step !== STEPS.INTRO) return;
    if (!agentData?.id) throw new Error('Missing agent. Please reload and try again.');

    const propertyData = {
      createdAt: serverTimestamp(),
      offPlan: false,
      priceHistory: [],
      showPriceRange: false,
      squareFootage,
      active: false,
      isEager: 80,
      wantsPremiumListing: false,
      agent: true,
      clientName,
      clientEmail,
      clientPhone,
      userId: agentData.id,
    };

    const docRef = await addDoc(collection(db, 'properties'), propertyData);
    setPropertyId(docRef.id);
  };

  const onNext = async () => {
    setErrors({});
    if (navLoading) return;
    const ok = validateStep();
    if (!ok) return;

    setNavLoading(true);
    try {
      await handlePriorSubmitIfNeeded();
      setStep((s) => s + 1);
    } catch (e) {
      console.error('Failed advancing step:', e);
      setErrors({ step: 'Something went wrong. Please try again.' });
    } finally {
      setNavLoading(false);
    }
  };

  const onBack = () => {
    if (step > STEPS.INTRO && step < STEPS.COMPLETE) {
      setErrors({});
      setStep((s) => s - 1);
    }
  };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    setErrors({});
    if (!validateStep()) return;

    if (!agentData?.id) {
      setErrors({ step: 'Missing agent data. Please refresh and try again.' });
      return;
    }
    if (!propertyId) {
      setErrors({ step: 'Property not created yet. Please go back a step and try again.' });
      return;
    }

    const auth = getAuth();
    let user = auth.currentUser;

    try {
      setIsSubmitting(true);

      if (!user) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
      }
      if (!user) throw new Error('Account creation failed.');

      const total = images.length;
      const imageUrls = [];

      // progress init
      await updateDoc(doc(db, 'properties', propertyId), {
        clientId: user.uid,
        userId: agentData.id,
        createdAt: serverTimestamp(),
        imageUploadProgress: {
          uploaded: 0,
          total,
          inProgress: total > 0,
        },
      });

      

      // upload sequentially to keep progress deterministic
      for (let i = 0; i < total; i++) {
        const file = images[i];
        const storageRef = ref(storage, `propertyImages/${user.uid}/${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // eslint-disable-next-line no-await-in-loop
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
        visibility: true,
        acceptingOffers: true,
        campaignId: 'FqMZd0mWlNlSBl66s7BN',
        isEager: 80,
        propertyType: type,
        wantsPremiumListing: false,
        agent: true,
        gotoMarketGoal: gotoMarketGoal?.date || null,
        clientName,
        clientEmail,
        clientPhone,
        vendorUploaded: true,
        agentManaged: true,
        clientId: user.uid,
        userId: agentData.id,
      };

      await updateDoc(doc(db, 'properties', propertyId), propertyData);
      await setDoc(doc(db, 'draftProperties', propertyId), {...propertyData, override: true});


      const userRef = doc(db, 'users', agentData.id);
      const userSnap = await getDoc(userRef);

      const docRef = await addDoc(collection(db, 'notifications'), {property: propertyData, createdAt: new Date(), read: false, type: "newProspect", user: userSnap.data()});


      setStep(STEPS.COMPLETE);
    } catch (err) {
      console.error('Submit failed:', err);
      setErrors({ step: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Render ----------
  const progressSteps = 9; // steps 1..9 (hide on 10)
  const headerBg = agentData?.primaryColor || '#0d9488';

  return (
    <div className={isHidden ? 'hidden' : 'fixed overflow-hidden z-50 w-full top-0 left-0 h-screen bg-white'}>
      <div className="overflow-y-scroll overflow-x-hidden text-gray-900 border-t border-gray-900 fixed inset-0 z-50 flex flex-col">
        {/* Progress bar */}
        {step < STEPS.COMPLETE && (
          <motion.div
            className="absolute top-0 left-0 h-1 bg-red-700"
            initial={{ width: 0 }}
            animate={{ width: `${(Math.min(step, progressSteps) / progressSteps) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Header */}
        
          <div className="h-20 w-full flex items-center" style={{ backgroundColor: headerBg }}>
            <div className="container mx-auto flex">
              <div className="flex-grow">
                <h2 className="px-10 sm:px-0 my-8 leading-none text-2xl inter text-white flex flex-wrap sm:flex-nowrap">
                  <img
                    onClick={closeModal}
                    src={agentData?.logo || './iconFull.png'}
                    className="mr-6 w-6 h-6 sm:w-16 sm:h-16 rounded sm:rounded-lg mb-4 sm:mb-0"
                    alt="agent-logo"
                  />
                </h2>
              </div>
              <button className="absolute top-0 right-0 m-3 sm:m-0 sm:relative cursor-pointer sm:right-4 text-white hover:text-gray-200">
                <X size={50} className="sm:block hidden" onClick={closeModal} />
                <X size={20} className="block sm:hidden" onClick={closeModal} />
              </button>
            </div>
          </div>
      

        {/* Body */}
        <div className="w-full max-w-5xl mx-auto py-10 px-10 sm:px-20 relative">
          {/* Step 1 */}
          {step === STEPS.INTRO && (
            <div className="px-0 sm:px-40">
              <h2 className="text-base font-semibold mb-4">
                Hi, I'm {agentData?.fullName} from {agentData?.companyName}. Welcome to the family. We've poured time and energy
                into building a space dedicated to our local community. If you haven’t heard yet, Premarket runs regular campaigns
                that give us the chance to showcase your property to serious buyers before it hits the market. To take advantage
                of this offer, please fill out the form below.
              </h2>
              <div className="mx-auto my-0 sm:my-10">
                <h2 className="text-2xl font-semibold mb-4">What's your name?</h2>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={clientName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border rounded mb-4 text-lg"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={clientEmail}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setClientEmail(e.target.value);
                  }}
                  className="w-full p-3 border rounded mb-4 text-lg"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={clientPhone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border rounded mb-4 text-lg"
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === STEPS.GOAL && (
  <div>
    <h2 className="text-2xl font-semibold mb-2">Everyone moves at their own pace.</h2>
    <p className="text-lg text-gray-600 mb-4">
      Let’s lock in a rough timeline so we can help you plan ahead with confidence.
    </p>

    <div className="grid grid-cols-1 gap-4">
      {GOAL_OPTIONS.map((option) => (
        <button
          key={option.label}
          className={`px-4 py-2 rounded-full text-base w-full sm:w-56 cursor-pointer hover:bg-gray-200 font-medium border border-gray-200 ${
            gotoMarketGoal?.label === option.label ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-800'
          }`}
          onClick={() => {
            const d = new Date();
            d.setMonth(d.getMonth() + option.months);
            // store a readable label + a real Date + ms epoch
            setGotoMarketGoal({
              label: option.label,
              months: option.months,
              date: d,
              ts: d.getTime(),
            });
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
)}

          {/* Step 3 */}
          {step === STEPS.ADDRESS && (
            <div>
              <h2 className="text-xl font-semibold mb-4 mt-4">Enter your address</h2>
              <LoadScript
                id="gmaps-script"
                googleMapsApiKey="AIzaSyBbLrFWUU62O_by81ihAVKvye4bHA0sah8"
                libraries={['places']}
              >
                <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceChanged}>
                  <input
                    type="text"
                    placeholder="Enter address"
                    className="h-14 border border-gray-200 rounded-lg w-full px-4"
                  />
                </Autocomplete>
              </LoadScript>
            </div>
          )}

          {/* Step 4 */}
          {step === STEPS.TYPE && (
            <div>
              <h2 className="text-lg sm:text-2xl font-semibold mb-4">What type of home do you have?</h2>
              <div className="grid grid-cols-1 gap-4">
                {homeTypes.map((item, idx) => (
                  <button
                    key={idx}
                    className={`px-4 py-2 rounded-full text-base w-full sm:w-56 cursor-pointer hover:bg-gray-200 font-medium border border-gray-200 ${
                      type === idx + 1 ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => setType(idx + 1)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === STEPS.PRICE && (
            <div>
              <h2 className="text-lg sm:text-2xl font-semibold mb-4">What price are you expecting?</h2>
              <input
                type="text"
                className="border rounded p-3 w-full text-xl"
                placeholder="$750,000"
                value={formattedPrice}
                onChange={(e) => {
                  const numeric = (e.target.value || '').replace(/\D/g, '');
                  setPriceRaw(numeric);
                }}
              />
            </div>
          )}

          {/* Step 6 */}
          {step === STEPS.DETAILS && (
            <div>
              <h2 className="text-lg sm:text-2xl font-semibold mb-4">Property Details</h2>
              <div className="flex space-x-3">
                <input
                  type="number"
                  placeholder="Bedrooms"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="mb-2 w-full p-3 border rounded"
                />
                <input
                  type="number"
                  placeholder="Bathrooms"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="mb-2 w-full p-3 border rounded"
                />
              </div>
              <div className="flex space-x-3">
                <input
                  type="number"
                  placeholder="Car Spaces"
                  value={carSpaces}
                  onChange={(e) => setCarSpaces(e.target.value)}
                  className="mb-2 w-full p-3 border rounded"
                />
                <input
                  type="number"
                  placeholder="Square Footage"
                  value={squareFootage}
                  onChange={(e) => setSquareFootage(e.target.value)}
                  className="mb-2 w-full p-3 border rounded"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6">
                {homeFeatures.map((feature, i) => (
                  <button
                    key={i}
                    onClick={() => toggleFeature(feature)}
                    className={`rounded-full w-full px-4 py-2 text-xs font-medium ${
                      features[feature] ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 7 */}
          {step === STEPS.IMAGES && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Upload Images</h2>
              <label htmlFor="images">
                <div className="flex items-center hover:bg-gray-800 justify-center h-14 text-center bg-gray-900 text-white rounded-lg cursor-pointer">
                  Upload Images
                </div>
                <input
                  type="file"
                  name="images"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="mb-4 text-sm text-gray-400 hidden"
                />
              </label>
              <div className="flex gap-2 flex-wrap mt-10">
                {images.map((img, i) => {
                  const src = typeof img === 'string' ? img : img?.preview;
                  if (!src) return null;
                  return (
                    <div key={i} className="relative">
                      <Image
                        src={src}
                        width={100}
                        height={100}
                        className="shadow-lg h-20 w-20 object-cover rounded-lg"
                        alt={`upload-${i}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 8
          {step === STEPS.TITLE_DESC && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Add a Title and Description</h2>
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border rounded mb-4 text-lg"
              />
              <textarea
                placeholder="Description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border rounded text-lg"
              />
            </div>
          )} */}

          {/* Step 9 */}
          {step === STEPS.ACCOUNT && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Create your account</h2>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded mb-4 text-lg"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded mb-4 text-lg"
              />
              <div className="flex items-center text-sm mt-2">
                <label>
                  <input type="checkbox" className="mr-2" required />
                  I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    terms and conditions
                  </a>
                </label>
              </div>
            </div>
          )}

          {/* Step 10 */}
          {step === STEPS.COMPLETE ? (
            <div className="h-[90vh] w-full bg-white text-center flex items-center justify-center">
              <div className="text-center px-4 bg-gray-100 overflow-y-scroll rounded-xl shadow-lg p-4 sm:p-10 relative">
                <button className="absolute top-3 right-0 cursor-pointer right-4 text-gray-400 hover:text-black">
                  <X size={30} onClick={closeModal} />
                </button>

                {/* Synthesia */}
                {/* <div
                  className="sm:h-72 mb-10 text-center flex-shrink mx-auto relative flex items-center justify-center"
                  style={{ overflow: 'hidden', aspectRatio: '1920 / 1080' }}
                >
                  <iframe
                    src="https://share.synthesia.io/embeds/videos/9d09d0b1-57eb-4835-81d8-2a3f231d37af"
                    loading="lazy"
                    title="Synthesia video player - Property Submitted"
                    allowFullScreen
                    className="mx-auto hidden sm:block"
                    allow="encrypted-media; fullscreen;"
                    style={{
                      position: 'absolute',
                      width: '500px',
                      height: '280px',
                      top: 0,
                      left: 0,
                      border: 'none',
                      padding: 0,
                      margin: 'auto',
                      overflow: 'hidden',
                      borderRadius: '12px',
                    }}
                  />
                  <iframe
                    src="https://share.synthesia.io/embeds/videos/9d09d0b1-57eb-4835-81d8-2a3f231d37af"
                    loading="lazy"
                    title="Synthesia video player - Property Submitted"
                    allowFullScreen
                    className="mx-auto sm:hidden block"
                    allow="encrypted-media; fullscreen;"
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '180px',
                      top: 0,
                      left: 0,
                      border: 'none',
                      padding: 0,
                      margin: 'auto',
                      overflow: 'hidden',
                      borderRadius: '12px',
                    }}
                  />
                </div> */}

                <h2 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-4">Property Submitted</h2>
                <p className="text-base sm:text-lg inter text-gray-700 max-w-xl mx-auto mb-6 leading-tight">
                  We’ve received your property details. If we need any additional information, our team will be in touch. In the meantime, we’ll use the information you’ve provided to connect with qualified buyers in our network.

We’ll keep you updated on market activity and any interest in your property as things progress.
                  <br />
                  {startDate && (
                    <>
                      {' '}
                      The next Premarket campaign will start on {' '}
                      <strong>
                        {startDate.toLocaleString('en-AU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </strong>
                    </>
                  )}
                  .
                </p>
                <div className="px-10 text-sm sm:text-lg inter text-gray-700 mb-4">
                  Keep an eye on your inbox we'll keep you updated as the campaign nears.
                </div>
                <p className="text-sm text-gray-700 mb-4">Be sure to download the Premarket App from the app stores:</p>
                <div className="sm:flex space-x-1 justify-center">
                  <a href="https://apps.apple.com/au/app/premarket-homes/id6742205449">
                    <img src="./apple.png" className="mt-4 sm:mt-3 w-36 mx-auto" alt="apple" />
                  </a>
                  <a href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en_AU">
                    <img src="./play.png" className="h-18 mx-auto -mt-4 sm:mt-0" alt="play" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl py-10 px-20 relative overflow-y-auto">{/* steps spacer */}</div>
          )}

          {/* Error bubble */}
          <div className="w-full sm:px-40 text-center">
            {errors.step && <div className="text-sm w-full text-red-800 bg-red-100 p-2 rounded-full mb-4">{errors.step}</div>}
          </div>
        </div>
      </div>

      {/* Nav Buttons */}
      {step < STEPS.COMPLETE && (
        <div className="mt-6 z-50 flex justify-between fixed bottom-0 w-full p-4 sm:p-20">
          {step > STEPS.INTRO && step < STEPS.COMPLETE && (
            <button onClick={onBack} className="cursor-pointer text-gray-700 hover:underline px-6 py-3 bg-gray-100 rounded-lg">
              Back Step
            </button>
          )}

          {step < STEPS.ACCOUNT ? (
            <button
              onClick={onNext}
              disabled={navLoading}
              style={{ backgroundColor: agentData?.primaryColor || '#0d9488', opacity: navLoading ? 0.7 : 1 }}
              className="ml-auto cursor-pointer text-white px-6 py-3 rounded-lg hover:bg-red-800 disabled:cursor-not-allowed"
            >
              {navLoading ? 'Working…' : 'Next Step'}
            </button>
          ) : step === STEPS.ACCOUNT ? (
            <button
              onClick={handleSubmit}
              className="ml-auto bg-red-700 cursor-pointer text-white px-6 py-3 rounded-lg hover:bg-red-800"
            >
              Add your property
            </button>
          ) : null}

          {isSubmitting && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <div className="bg-white p-20 rounded-lg border border-gray-200 shadow-xl text-center">
                <img onClick={closeModal} src="./iconFull.png" className="mx-auto mb-4 w-10 h-10 rounded-lg" alt="logo" />
                <h2 className="text-xl text-gray-900 font-semibold mb-2">Uploading your property...</h2>
                <p className="text-sm text-gray-600">Please wait while we upload your images and save your listing.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
