'use client'
import {useEffect,useState} from 'react'
import React from 'react'

import {getDecodedToken} from './utils'

interface PermissionProps{
required:string[];
children:React.ReactNode;
}
const PermissionGuard = ({required,children}:PermissionProps)=>{
    const [hasAccess, setHasAccess]=useState(false)
    useEffect(()=>{
        const token= getDecodedToken()
        // const permissions:string[]= token?.permissions
    })
}