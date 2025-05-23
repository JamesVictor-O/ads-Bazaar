import React from 'react'

const selfVerification = () => {
  return (
    <div>
        <h1 className='text-2xl font-bold text-center'>Self Verification</h1>
        <p className='text-center'>Please verify your identity to proceed.</p>
        <form className='flex flex-col items-center mt-4'>
            <input type="text" placeholder="Enter your verification code" className='border border-gray-300 rounded p-2 mb-4' />
            <button type="submit" className='bg-blue-500 text-white rounded p-2'>Verify</button>
        </form>
    </div>
  )
}

export default selfVerification
