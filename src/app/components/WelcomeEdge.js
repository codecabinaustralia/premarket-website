'use client';

export default function Welcome() {
    return (

        <section className="bg-white py-20">
            <div className="container mx-auto px-8 sm:px-20">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mt-4 sm:mt-0 order-2 sm:order-1 md:w-1/2 sm:p-8 text-center sm:text-left">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                            "Premarket Edge" helps home owners facilitate the sale of their own home.
                        </h1>
                        <p className="inter text-lg text-gray-600 mb-6">
                           If your campaign takes off and you accept an offer, use Premarket Edge to seal the deal.
For a low flat fee, we’ll connect you with trusted professionals — conveyancers, mortgage brokers, and removalists — all vetted and ready. Our guided process lays out every step so you always know what’s next and where you stand.
                        </p>
                    </div>
                    <div className="sm:order-2 md:w-1/2 px-10 -mt-10 relative">
                        <img src="/assets/edge.png" alt="Welcome" className="w-full h-auto rounded-2xl shadow-lg" />
                    </div>

                </div>
            </div>
        </section>
    )
}