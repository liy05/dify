'use client'
import React from 'react'
import DifyLogo from '@/app/components/base/logo/dify-logo'
import AccountDropdown from '@/app/components/header/account-dropdown'

const HomeHeader = () => {
  return (
    <div className="flex items-center justify-between border-b border-divider-subtle bg-background-default px-6 py-3">
      {/* Logo */}
      <div className="flex items-center">
        <DifyLogo size="medium" />
      </div>

      {/* Right side - User dropdown */}
      <div className="flex items-center">
        <AccountDropdown />
      </div>
    </div>
  )
}

export default HomeHeader
