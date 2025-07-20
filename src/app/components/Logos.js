// components/Features.js

export default function Features() {
  const logos = [
    { src: '/assets/logos/1.png', alt: 'Logo 1' },
    { src: '/assets/logos/2.png', alt: 'Logo 2' },
    { src: '/assets/logos/3.png', alt: 'Logo 3' },
    { src: '/assets/logos/4.png', alt: 'Logo 4' },
    { src: '/assets/logos/5.png', alt: 'Logo 5' },
    { src: '/assets/logos/6.png', alt: 'Logo 6' },
  ];

  return (
    <section className="bg-white py-20 border-b border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-center">
          {logos.map((logo, index) => (
            <div key={index} className="flex justify-center items-center">
              <img
                src={logo.src}
                alt={logo.alt}
                className=" object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
