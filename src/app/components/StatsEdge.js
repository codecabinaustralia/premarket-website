'use client';

import Image from 'next/image';

export default function StatBox() {
    const stats = [
        {
            title: '40% of homeowners consider selling in the next 12 months.',
            stat: '40%',
            image: '/images/homeowners.png',
        },
        {
            title: 'Homes that pre-test get 3x more buyer interactions.',
            stat: '3x',
            image: '/images/interactions.png',
        },
        {
            title: '78% of sellers regret not knowing buyer demand earlier.',
            stat: '78%',
            image: '/images/regret.png',
        },
    ];

    return (
        <div className="flex bg-gray-900 border border-gray-300 w-full">

            <div className="container flex flex-wrap sm:flex-nowrap mx-auto px-4">
                <div className='w-full flex items-center'>
                    <div className='p-4 text-center w-full'>

                        <p className="tracking-tight text-6xl sm:text-5xl leading-tight interBold tracking-tight text-white leading-tight">
                            $30,000
                        </p>
                        <p className="text-3xl sm:text-3xl tracking-tight leading-tight font-bold tracking-tight text-white leading-tight">
                           Average comission for an agent,<br /> up 300% since 2000.
                        </p>


                        <div className='text-gray-600 text-sm italic mt-2'>
                            Data based on Sydney Australia
                        </div>
                    </div>
                </div>

               

            </div>
        </div>
    );
}
