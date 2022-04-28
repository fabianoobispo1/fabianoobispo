import React, { useState, useEffect } from 'react'
import ReactDom from 'react-dom'

import styles from './styles.module.scss';

interface ModalProps {
  isShowing: boolean;
  toggle: () => void;
  children: React.ReactChild;
}

const Modal: React.FC<ModalProps> = ({ isShowing, toggle, children }) => { 
  useEffect(() => {
    const listner = function (e: KeyboardEvent ) {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();

        isShowing && toggle();
      }
    }

    window.addEventListener('keyup', listner)

    return (() => {
      window.removeEventListener('keyup', listner)
    })

  }, [isShowing, toggle])

  return (
    isShowing ? ReactDom.createPortal(
      <div className={styles.modalOverlay}>
        <div className={styles.modalWrapper}>
          <div className={styles.modal}>
            {children}
          </div>
        </div>
      </div>, document.body
    ) : null
  )
}

interface ModalHeaderProps {
  toggle: () => void;
  children: React.ReactChild;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ toggle, children }) => (
	<div className={styles.modalHeader}>
		{children || 'Title'}
    <button className={styles.modalButtonClose} data-dismiss="modal" aria-label="Close" onClick={toggle}>
      &times;
    </button>    
	</div>
)

interface ModalBodyProps {
    children: React.ReactChild;
  }

export const ModalBody: React.FC<ModalBodyProps> = ({ children }) => (
	<div className={styles.modalBody}>
		{children}
	</div>
)

interface ModalFooterProps {
   children: React.ReactChild;
  }

export const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => (
	<div className={styles.modalFooter}>
		{children}
  </div>
)

export const useModal = () => {
  const [isShowing, setIsShowing] = useState(false);

  function toggle() {
    setIsShowing(!isShowing);
  }

  return {
    isShowing,
    toggle,
  }
}

export default Modal;