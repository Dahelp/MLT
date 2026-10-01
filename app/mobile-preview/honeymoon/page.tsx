import type { Metadata } from "next";
import MobileCollectionPreview from "../MobileCollectionPreview";
export const metadata: Metadata={title:"MLT Honeymoon — Mobile Preview",robots:{index:false,follow:false}};
export default function Page(){return <MobileCollectionPreview collectionId="honeymoon"/>}
