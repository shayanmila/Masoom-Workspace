import type { ReactNode } from 'react';
export const metadata = { title: 'Masoom Workspace', description: 'Private company workspace' };
export default function RootLayout({children}:{children:ReactNode}) {return <html lang="en"><body style={{margin:0,fontFamily:'system-ui,Segoe UI,sans-serif',background:'#f6f8fc',color:'#17243d'}}>{children}</body></html>}
