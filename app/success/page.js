"use client"
import Header from '@/Components/Header/Header'
import Sidebar from '@/Components/Sidebar/Sidebar'
import React from 'react'
import "/public/Styles/Pricing.css"
import "/public/Styles/side-menu.css"
import "/public/Styles/success.css"

import "/public/Styles/style.css"
import Link from 'next/link'
const page = () => {
  return (
    <div className='forclr'>
      <Sidebar />
      <Header />
      <div className="main-container">
        <div className="main-content" id="content"> 
          <main>
            <div className="content">
              <div className="paymentSuccess">
                <div className="successMessageContainer">
                  <h2 className="successHeading">Subscription Successful!</h2>
                  <p className="successText">
                    Thank you for your subscription. Your journey towards effective ad management starts
                    now!
                  </p>
                  <Link  href="/main" className='linktag'><button className='successButton' >Go Home</button></Link>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default page
