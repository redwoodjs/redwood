import React from 'react'
import classNames from 'classnames'

import Button from '../Button/Button'

import SetAppIcon from './setapp-icon.svg'

const SetappButton = ({
  classes = '',
  colours = 'text-white bg-black hover:bg-gray-800',
  children,
}) => {
  const buttonClasses = classNames(
    'transform hover:scale-105',
    classes,
    colours
  )

  return (
    <a
      target="_blank"
      referrerPolicy="origin"
      rel="noreferrer"
    >
      <Button className={buttonClasses} icon={SetAppIcon}>
        {children || 'Get it on Setapp'}
      </Button>
    </a>
  )
}

export default SetappButton
