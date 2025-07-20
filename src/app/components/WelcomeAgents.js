'use client';

export default function Welcome() {
    return (

        <section className="bg-white py-20">
            <div className="container mx-auto px-8 sm:px-20">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mt-4 sm:mt-0 order-2 sm:order-1 md:w-1/2 sm:p-8 text-center sm:text-left">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                            Premarkets "Go To Market" product was designed to help home owners sell with more confidence.
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                           After running your campaign, you will have a better understanding of the market demand for your home. Choose to hire a verified agent in your area to represent your home. Buyers who have expressed interest in your home will be notified that your property is going to market to help kickstart the next stage. 
                        </p>
        
                    </div>

                    <div className="sm:order-2 md:w-1/2 px-10 -mt-10 relative">
 
            <img src="/assets/gotomarket.png" alt="Welcome" className="w-full h-auto rounded-2xl shadow-lg" />
          </div>

                </div>
            </div>
        </section>
    )
}