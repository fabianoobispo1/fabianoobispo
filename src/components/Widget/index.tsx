
import {ChatTeardropDots} from 'phosphor-react'
import { Popover } from '@headlessui/react'

import styles from "./styles.module.scss";



export function Widget() {
 
  return (
    <Popover className={styles.popover}>

          <Popover.Panel>clicked</Popover.Panel>
            
            <Popover.Button  className={styles.popoverButton}>
                <ChatTeardropDots  className={styles.popoverButtonIcon}/>
                <span>                    
                  Feedback 
                </span>
            </Popover.Button>
        </Popover>    
  );
}
