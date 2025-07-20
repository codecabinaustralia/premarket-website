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
        <div className="flex bg-white border border-gray-300 w-full">

            <div className="container flex flex-wrap sm:flex-nowrap mx-auto px-4">
                <div className='w-full sm:w-2/3 flex items-center'>
                    <div className='p-4 text-left '>

                        <p className="tracking-tight text-6xl sm:text-7xl leading-tight interBold tracking-tight text-blue-700 leading-tight">
                            $1.3 billion
                        </p>
                        <p className="text-3xl sm:text-5xl tracking-tight leading-tight font-bold tracking-tight text-gray-900 leading-tight">
                            Wasted every year by Aussie homeowners listing their homes and not selling.
                        </p>


                        <div className='text-gray-600 text-sm italic mt-2'>
                            All because they didn't have Premarket
                        </div>
                    </div>
                </div>

                <div className='w-full sm:w-1/3 flex flex-col items-center sm:justify-center p-10'>

                    <div className='p-4 text-left sm:border-l-2 border-gray-900 my-2'>

                        <p className="tracking-tight text-4xl leading-tight interBold tracking-tight text-blue-700 leading-tight">
                            45,205 years
                        </p>

                        <p className="text-base  text-gray-900 leading-tight">
                            of collective seller time… flushed
                        </p>

                    </div>

                    <div className='p-4 text-left sm:border-l-2 border-gray-900 my-2'>

                        <p className="tracking-tight text-4xl leading-tight interBold tracking-tight text-blue-700 leading-tight">
                            33%
                        </p>

                        <p className="text-base  text-gray-900 leading-tight">
                            Homes don't sell first time round
                        </p>

                    </div>



                </div>


            </div>
        </div>
    );
}
