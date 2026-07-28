/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "next-auth" {
  export default function NextAuth(config: any): {
    handlers: { GET: any; POST: any };
    signIn: any;
    signOut: any;
    auth: any;
  };
}

declare module "next-auth/providers/credentials" {
  export default function Credentials(config: any): any;
}

declare module "next-auth/react" {
  export function useSession(): { data: any; status: string; update: (data?: any) => Promise<any> };
  export function SessionProvider(props: {
    children: React.ReactNode;
    session?: any;
  }): JSX.Element;
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
}
