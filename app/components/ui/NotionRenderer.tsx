"use client";

import dynamic from 'next/dynamic'
import { NotionRenderer } from "react-notion-x";
import { ExtendedRecordMap } from 'notion-types'

interface RendererProps {    
    recordMap: ExtendedRecordMap    
}

export default function Renderer({ recordMap }: RendererProps) {
    const Collection = dynamic(() =>
        import('react-notion-x/build/third-party/collection').then(
          (m) => m.Collection
        )
      )
    return (
        <div>
            <NotionRenderer 
                recordMap={recordMap}
                components={{
                    Collection
                }}
            />
        </div>
    );
}