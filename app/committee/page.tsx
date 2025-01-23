// This is committee page and should be done by Team Melissa
// Todo: Slicing the design and need to create functionallity to fetch the data from the notion database and render the data on this page

'use client';

import { useEffect, useState } from 'react';
import {
    CommCard,
    CommCardDescription,
    CommCardGroup,
    CommCardGroupTitle,
    CommCardHeader,
    CommCardImage,
    CommCardTitle,
} from '../components/ui/committee-card';
import TitleHeader from '../components/ui/title';
import { committeeData } from '../data/committee';

export default function Committee() {
    const [width, setWidth] = useState<number>(0);
    const [columns, setColumns] = useState<2 | 3>(3);

    useEffect(() => {
        if (typeof window !== undefined) {
            setWidth(window.innerWidth);
            const handleResize = () => setWidth(window.innerWidth);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    useEffect(() => {
        if (width >= 768) {
            setColumns(3);
        } else {
            setColumns(2);
        }
    }, [width]);

    return (
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start min-h-screen">
            <div className="w-full h-[25vh] md:h-[35vh] lg:h-[50vh]">
                <img
                    src="/test_img2.png"
                    alt="PINUS Committee Image"
                    className="w-full h-full object-cover object-center"
                />
            </div>
            <div className="w-full">
                <TitleHeader text="Our Committee" color="blue" />
            </div>

            <div className="w-full flex flex-col gap-y-16 p-4">
                {committeeData.map((group) => (
                    <div
                        className="flex flex-col justify-center gap-4"
                        key={group.key}
                        id={group.key}>
                        <CommCardGroupTitle>{group.name}</CommCardGroupTitle>
                        <CommCardGroup columns={columns} gap={5}>
                            {group.members.map((member) => (
                                <CommCard key={member.name}>
                                    <CommCardImage
                                        src="/test_img.jpg"
                                        alt={member.name}
                                        width={24}
                                        height={32}
                                    />
                                    <CommCardHeader>
                                        <CommCardTitle>
                                            {member.name}
                                        </CommCardTitle>
                                        <CommCardDescription italic>
                                            {member.role}
                                        </CommCardDescription>
                                    </CommCardHeader>
                                </CommCard>
                            ))}
                        </CommCardGroup>
                    </div>
                ))}
            </div>
        </main>
    );
}
