import type { Metadata } from "next";
import type { Locale } from "../../../content/i18n";
import { publicMetadata } from "../../../content/seo";
import VouchersPage from "../../vouchers/VouchersPage";
import {notFound} from "next/navigation";
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!['en','de','ru','it','pl'].includes(locale))notFound();return <VouchersPage locale={locale as 'en'|'de'|'ru'|'it'|'pl'}/>}

export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return publicMetadata(locale,"vouchers");}
