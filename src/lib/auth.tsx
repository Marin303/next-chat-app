import { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import GoogleProvider from 'next-auth/providers/google'
import { db } from "./db";

function getGoogleCredentials(){
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    const missingClientId = !clientId || clientId.length === 0
    const missingSecret = !clientSecret || clientSecret.length === 0

    if(missingClientId){
        throw new Error('Missing GOOGLE_CLIENT_ID')
    }
    if(missingSecret){
        throw new Error('Missing GOOGLE_SECRET')
    }
    return {clientId, clientSecret}
}

export const authOptions: NextAuthOptions = {
    adapter: UpstashRedisAdapter(db),
    session:{
        strategy:'jwt'
    },
    pages:{
        signIn:'/login'
    },
    providers:[
        GoogleProvider({
            clientId: getGoogleCredentials().clientId,
            clientSecret: getGoogleCredentials().clientSecret
        }),
    ],
    callbacks:{
        async jwt({token, user}){
            const dbUser = (await db.get(`user:${token.id}`)) as User | null

            if(!dbUser){
                token.id = user!.id
                return token
            }
            return{
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image
            }
        }
    }
}