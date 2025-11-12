'use client';

import { useEffect, useState, useRef } from 'react';
import { X, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import Header from '../components/Header';
import { useModal } from '../context/ModalContext';

import { storage, db } from '../firebase/clientApp';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
    collection,
    addDoc,
    updateDoc,
    serverTimestamp, 
    getDocs, 
    orderBy, 
    limit, 
    query,
    doc,
    getDoc
} from 'firebase/firestore';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
} from 'firebase/storage';

export default function PropertyFormModal() {
    const autocompleteRef = useRef(null);
    const { showModal, setShowModal } = useModal();
    const isHidden = !showModal;

    const [step, setStep] = useState(1);
    const [address, setAddress] = useState(null);
    const [type, setType] = useState(null);
    const [priceRaw, setPriceRaw] = useState('');
    const [bathrooms, setBathrooms] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [carSpaces, setCarSpaces] = useState('');
    const [squareFootage, setSquareFootage] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState(null);
    const [features, setFeatures] = useState({});
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsContent, setTermsContent] = useState({ vendor: '', agent: '' });
    const [showTermsModal, setShowTermsModal] = useState(false);

    const homeTypes = ['House', 'Apartment', 'Villa', 'Townhouse', 'Acreage'];
    const homeFeatures = [
        'Pool', 'Granny Flat', 'Solar', 'Air Conditioning',
        'Outdoor Entertainment Area', 'Garage / Secure Parking',
        'Study', 'Ensuite', 'Smart Home Features', 'Built-in Wardrobes'
    ];

    const [startDate, setStartDate] = useState(null);

    useEffect(() => {
        async function fetchStartDate() {
            const q = query(collection(db, 'campaigns'), orderBy('created', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                const date = data.startDate.toDate ? data.startDate.toDate() : new Date(data.startDate.seconds * 1000);
                setStartDate(date);
            }
        }

        fetchStartDate();
    }, []);

    // Fetch terms and conditions
    useEffect(() => {
        async function fetchTerms() {
            try {
                const vendorDoc = await getDoc(doc(db, 'settings', 'addPropertyTermsVendor'));
                const agentDoc = await getDoc(doc(db, 'settings', 'addPropertyTermsAgent'));
                
                setTermsContent({
                    vendor: vendorDoc.exists() ? vendorDoc.data().body : '',
                    agent: agentDoc.exists() ? agentDoc.data().body : ''
                });
            } catch (err) {
                console.error('Error fetching terms:', err);
            }
        }

        fetchTerms();
    }, []);

    const toggleFeature = (feature) => {
        setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
    };

    const handlePlaceChanged = () => {
        const autocomplete = autocompleteRef.current;
        if (autocomplete) {
            const place = autocomplete.getPlace();
            const formatted = place.formatted_address || '';
            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();

            setAddress(formatted);
            if (lat && lng) {
                setLocation({ latitude: lat, longitude: lng });
            }
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => {
            file.preview = URL.createObjectURL(file);
            return file;
        });
        setImages((prev) => [...prev, ...newImages]);
    };

    const resetForm = () => {
        setStep(1);
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
        setTermsAccepted(false);
    };

    const closeModal = () => {
        resetForm();
        setShowModal(false);
    };

    const validateStep = () => {
        const newErrors = {};

        if (step === 1 && !address) newErrors.step = 'Please enter a valid address.';
        if (step === 2 && !type) newErrors.step = 'Please select a property type.';
        if (step === 3 && !priceRaw) newErrors.step = 'Please enter your expected price.';
        if (step === 5 && images.length === 0) newErrors.step = 'Please upload at least one image.';
        if (step === 6 && (!title || !description)) newErrors.step = 'Please enter a title and description.';
        if (step === 7) {
            if (!email || !password) newErrors.step = 'Please enter an email and password.';
            else if (!email.includes('@')) newErrors.step = 'Please enter a valid email address.';
            else if (password.length < 6) newErrors.step = 'Password must be at least 6 characters.';
            else if (!termsAccepted) newErrors.step = 'Please accept the terms and conditions to continue.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep()) setStep((s) => s + 1);
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;
        const auth = getAuth();
        let user = auth.currentUser;

        try {
            setIsSubmitting(true);

            if (!user) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
            }

            if (!user) throw new Error('Account creation failed.');

            const total = images.length;
            const imageUrls = [];
            const docRef = await addDoc(collection(db, 'properties'), {
                userId: user.uid,
                createdAt: serverTimestamp(),
                imageUploadProgress: { uploaded: 0, total, inProgress: true },
            });

            for (let i = 0; i < total; i++) {
                const file = images[i];
                const storageRef = ref(storage, `propertyImages/${user.uid}/${Date.now()}-${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed', null, reject, async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        imageUrls.push(downloadURL);

                        await updateDoc(docRef, {
                            imageUploadProgress: {
                                uploaded: imageUrls.length,
                                total,
                                inProgress: imageUrls.length < total,
                            },
                        });
                        resolve();
                    });
                });
            }

            const propertyData = {
                address,
                formattedAddress: address,
                bathrooms, bedrooms, carSpaces,
                createdAt: serverTimestamp(),
                description, imageUrls,
                imageUploadProgress: { uploaded: total, total, inProgress: false },
                features: Object.keys(features).filter(f => features[f]),
                location,
                offPlan: false,
                postcode: '',
                priceHistory: [],
                price: priceRaw,
                toPrice: null,
                showPriceRange: false,
                squareFootage,
                title,
                active: false,
                userId: user.uid,
                isEager: 80,
                propertyType: type,
                wantsPremiumListing: false,
                termsAcceptedAt: serverTimestamp(),
            };

            await updateDoc(docRef, propertyData);
            setStep(8);

        } catch (err) {
            console.error('Submit failed:', err);
            setErrors({ step: 'Something went wrong. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format terms text with line breaks
    const formatTermsText = (text) => {
        if (!text) return '';
        return text.split('\\n').join('\n');
    };

    return (
        <div className={isHidden ? 'hidden' : 'fixed overflow-hidden z-50 w-full z-90 top-0 left-0 h-screen bg-white'}>

            <div className="overflow-y-scroll overflow-x-hidden text-gray-900 border-t border-gray-900 relative fixed inset-0 z-50 flex flex-col justify-center">

                <motion.div
                    className="absolute top-0 left-0 h-1 bg-red-700"
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 7) * 100}%` }}
                    transition={{ duration: 0.4 }}
                />

                {step < 8 && (
                    <div className='h-40 bg-gray-900 w-full flex items-center'>

                        <div className='container mx-auto flex'>
                            <div className='flex-grow'>
                                <h2
                                    className="px-10 sm:px-0 my-8 leading-none text-2xl sm:text-4xl inter text-white flex flex-wrap sm:flex-nowrap"
                                >
                                    <img onClick={closeModal} src="./iconFull.png" className="mr-2 w-6 h-6 sm:w-10 sm:h-10 rounded sm:rounded-lg mb-4 sm:mb-0" /> Add your property to the next campaign
                                </h2>

                                {errors.step && (
                                    <p className="text-sm text-red-800 bg-red-100 p-2 rounded-full mb-4 mx-10 sm:mx-0">
                                        {errors.step}
                                    </p>
                                )}
                            </div>
                            <button className="absolute top-0 right-0 m-3 sm:m-0 sm:relative cursor-pointer sm:right-4 text-white hover:text-black">
                                <X size={50} className='sm:block hidden' onClick={closeModal} />
                                <X size={20} className='block sm:hidden' onClick={closeModal} />
                            </button>
                        </div>
                    </div>
                )}

                <div className=" w-full max-w-5xl mx-auto py-10  px-10 sm:px-20 relative h-[90vh]">
                    {/* Step 1 - Address */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 mt-4">Enter your address</h2>
                            <LoadScript googleMapsApiKey="AIzaSyBbLrFWUU62O_by81ihAVKvye4bHA0sah8" libraries={['places']}>
                                <Autocomplete
                                    onLoad={(ref) => (autocompleteRef.current = ref)}
                                    onPlaceChanged={handlePlaceChanged}>
                                    <input type="text" placeholder="Enter address" className="h-14 border border-gray-200 rounded-lg w-full px-4" />
                                </Autocomplete>
                            </LoadScript>
                        </div>
                    )}

                    {/* Step 2 - Type of Home */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-lg sm:text-2xl font-semibold mb-4">What type of home do you have?</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {homeTypes.map((item, idx) => (
                                    <button
                                        key={idx}
                                        className={`px-4 py-2 rounded-full text-base w-full sm:w-56 cursor-pointer hover:bg-gray-200 font-medium border border-gray-200 ${type === idx + 1 ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                                        onClick={() => setType(idx + 1)}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3 - Price */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-lg sm:text-2xl font-semibold mb-4">What price are you expecting?</h2>
                            <input
                                type="text"
                                className="border rounded p-3 w-full text-xl"
                                placeholder="$750,000"
                                value={
                                    priceRaw
                                        ? Intl.NumberFormat('en-AU', {
                                            style: 'currency',
                                            currency: 'AUD',
                                            maximumFractionDigits: 0,
                                        }).format(Number(priceRaw))
                                        : ''
                                }
                                onChange={(e) => {
                                    const numeric = e.target.value.replace(/\D/g, '');
                                    setPriceRaw(numeric);
                                }}
                            />
                        </div>
                    )}

                    {/* Step 4 - Features */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-lg sm:text-2xl font-semibold mb-4">Property Details</h2>
                            <div className='flex space-x-3'>
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
                                /></div>
                            <div className='flex space-x-3'>
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
                                />  </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6">
                                {homeFeatures.map((feature, i) => (
                                    <button
                                        key={i}
                                        onClick={() => toggleFeature(feature)}
                                        className={`rounded-full w-full px-4 py-2 text-xs font-medium ${features[feature] ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-800'}`}
                                    >
                                        {feature}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5 - Image Upload */}
                    {step === 5 && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Upload Images</h2>
                            <label name="images">
                                <div className='flex items-center hover:bg-blue-800 justify-center h-14 text-center bg-gray-900 text-white rounded-lg bg-gray-800 cursor-pointer'>Upload Images</div>
                                <input
                                    type="file"
                                    name="images"
                                    id='images'
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

                    {/* Step 6 - Title + Description */}
                    {step === 6 && (
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
                    )}

                    {/* Step 7 - Account Creation & Terms */}
                    {step === 7 && (
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
                                placeholder="Password (min. 6 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border rounded mb-6 text-lg"
                            />

                            {/* Terms and Conditions */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6 mb-6">
                                <div className="flex items-start mb-4">
                                    <FileText className="text-red-700 mr-3 mt-1 flex-shrink-0" size={24} />
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms and Conditions</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Please review and accept our terms to continue
                                        </p>
                                    </div>
                                </div>

                                {/* Terms Preview Box */}
                                <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                                    <div className="space-y-4">
                                        {termsContent.vendor && (
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900 mb-2">Vendor Terms:</h4>
                                                <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                                                    {formatTermsText(termsContent.vendor).substring(0, 300)}...
                                                </p>
                                            </div>
                                        )}
                                        {termsContent.agent && (
                                            <div>
                                                <h4 className="font-semibold text-sm text-gray-900 mb-2">Agent Terms:</h4>
                                                <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                                                    {formatTermsText(termsContent.agent).substring(0, 300)}...
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* View Full Terms Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowTermsModal(true)}
                                    className="w-full mb-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                                >
                                    View Full Terms & Conditions
                                </button>

                                {/* Acceptance Checkbox */}
                                <label className="flex items-start cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-1 mr-3 w-5 h-5 text-red-700 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                        I have read and agree to the <span className="font-semibold">Terms and Conditions</span> for both vendors and agents, and I understand my obligations under these agreements.
                                    </span>
                                </label>

                                {errors.step && !termsAccepted && (
                                    <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                                        ⚠ You must accept the terms to continue
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 8 ? (
                        <div className="h-[90vh] w-full bg-white text-center flex items-center justify-center">
                            <div className="text-center px-4 bg-gray-100 overflow-y-scroll rounded-xl shadow-lg p-4 sm:p-10 relative">
                                <button className="absolute top-3 right-0 cursor-pointer right-4 text-gray-400 hover:text-black">
                                    <X size={30} onClick={closeModal} />
                                </button>

                                {/* Synthesia Video Embed */}
                                <div
                                    className='sm:h-72 mb-10 text-center flex-shrink mx-auto relative flex items-center justify-center'
                                    style={{
                                        overflow: 'hidden',
                                        aspectRatio: '1920 / 1080',
                                    }}
                                >
                                    <iframe
                                        src="https://share.synthesia.io/embeds/videos/9d09d0b1-57eb-4835-81d8-2a3f231d37af"
                                        loading="lazy"
                                        title="Synthesia video player - Property Submitted"
                                        allowFullScreen
                                        className='mx-auto hidden sm:block'
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
                                        className='mx-auto sm:hidden block'
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
                                </div>

                                <h2 className="text-xl sm:text-3xl font-semibold text-gray-900 mb-4">Property Submitted</h2>
                                <p className="text-base sm:text-lg  inter text-gray-700 max-w-xl mx-auto mb-6 leading-tight">
                                    Your property has been submitted for approval. Campaigns run every 30 days.
                                    We want to give you the best shot, so we'll let you know if there's anything you can do to improve your success.
                                    <br />{startDate && (
                                        <> Entries will close at <strong>{startDate.toLocaleString('en-AU', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}</strong></>
                                    )}.
                                </p>
                                <div className="px-10 text-sm sm:text-lg inter text-gray-700 mb-4">
                                    Keep an eye on your inbox we'll keep you updated as the campaign nears.
                                </div>
                                <p className="text-sm text-gray-700 mb-4">
                                    Be sure to download the Premarket App from the app stores:
                                </p>
                                <div className="sm:flex space-x-1 justify-center">
                                    <a href="https://apps.apple.com/au/app/premarket-homes/id6742205449">
                                        <img src="./apple.png" className="mt-4 sm:mt-3 w-36 mx-auto" />
                                    </a>
                                    <a href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en_AU">
                                        <img src="./play.png" className="h-18 mx-auto -mt-4 sm:mt-0" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className=" w-full max-w-3xl py-10  px-20 relative h-[90vh] overflow-y-auto">
                            {/* Steps as before */}
                        </div>
                    )}
                </div>
            </div>

            {/* Full Terms Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <FileText className="text-red-700 mr-3" size={28} />
                                <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
                            </div>
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-grow">
                            {termsContent.vendor && (
                                <div className="mb-8">
                                    <div className="bg-red-50 border-l-4 border-red-700 p-4 mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">Vendor Terms</h3>
                                        <p className="text-xs text-gray-600">Please read carefully</p>
                                    </div>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                            {formatTermsText(termsContent.vendor)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {termsContent.agent && (
                                <div className="mb-6">
                                    <div className="bg-blue-50 border-l-4 border-blue-700 p-4 mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">Agent Terms</h3>
                                        <p className="text-xs text-gray-600">Please read carefully</p>
                                    </div>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                            {formatTermsText(termsContent.agent)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => {
                                    setShowTermsModal(false);
                                    setTermsAccepted(true);
                                }}
                                className="w-full bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition-colors font-semibold"
                            >
                                I Accept These Terms
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav Buttons */}
            {step < 8 && (
                <div className="mt-6 z-50 flex justify-between fixed bottom-0 w-full p-4 sm:p-20">
                    {step > 1 && step < 8 && (
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            className="cursor-pointer text-gray-700 hover:underline px-6 py-3 bg-gray-100 rounded-lg"
                        >
                            Back Step
                        </button>
                    )}
                    {step < 7 && (
                        <button
                            onClick={nextStep}
                            className="ml-auto bg-red-700 cursor-pointer text-white px-6 py-3 rounded-lg hover:bg-red-800"
                        >
                            Next Step
                        </button>
                    )}
                    {step === 7 && (
                        <button
                            onClick={handleSubmit}
                            disabled={!termsAccepted || isSubmitting}
                            className={`ml-auto px-6 py-3 rounded-lg font-semibold transition-all ${
                                termsAccepted && !isSubmitting
                                    ? 'bg-red-700 text-white hover:bg-red-800 cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Your Campaign'}
                        </button>
                    )}

                    {isSubmitting && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white p-20 rounded-lg border border-gray-200 shadow-xl text-center">
                                <img onClick={closeModal} src="./iconFull.png" className="mx-auto mb-4 w-10 h-10 rounded-lg" />
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