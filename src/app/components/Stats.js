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
                    <div className='p-4 text-left sm:flex sm:flex- sm:space-x-10 items-center'>

                        <div>
                            <p className="tracking-tight text-6xl sm:text-7xl leading-tight interBold tracking-tight text-amber-700 leading-tight">
                                71%
                            </p>
                        </div>
                        <div>
                            <p className="text-3xl sm:text-4xl tracking-tight leading-tight font-bold tracking-tight text-gray-900 leading-tight">
                                of homeowners would sell today… if they got the right price.</p>


                            <div className='text-gray-600 text-sm italic mt-2'>
                                They just lack confidence to go to market
                            </div>
                        </div>
                    </div>
                </div>

                <div className='w-full sm:w-1/3 flex flex-col items-center sm:justify-center sm:border-l border-gray-200'>

                    <div className='p-4 sm:p-10 text-left  my-2'>

                        <p className="tracking-tight text-4xl leading-tight interBold tracking-tight text-amber-700 leading-tight">
                            54%
                        </p>

                        <p className="text-base  text-gray-900 leading-tight">
                            of owners are “interested but hesitant” because they’re unsure about buyer demand.
                        </p>

                    </div>





                </div>


            </div>
        </div>
    );
}
