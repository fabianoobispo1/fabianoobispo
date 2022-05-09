import { Camera, Trash } from "phosphor-react";
import html2canvas from  'html2canvas';
import { useState } from "react";
import { Loading } from "../../Loading";

interface ScreenshotButtonProps {
    screenshot: string | null;
    onScreenshotTook: (screenshot: string | null) => void;
}


export function ScreenshotButton({
    screenshot,
    onScreenshotTook
}: ScreenshotButtonProps) {
    const [isTakingSecreenShot, setIsTakingSecreenShot] = useState(false)

    async function handleTakeScreenShot(){
        setIsTakingSecreenShot(true)
        
        const canvas = await html2canvas(document.querySelector('html')!)
        const base64image = canvas.toDataURL('image/png')
        
        onScreenshotTook(base64image);
        setIsTakingSecreenShot(false)
    }


    if (screenshot) {
        return (
            <button
                type="button"
                className="p-1 w-10 h-10 rounded-md border-transparent flex justify-end items-end text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-brand-500"
                onClick={() => onScreenshotTook(null)}
                style={{
                    backgroundImage: `url(${screenshot})`,
                  /*   backgroundPosition: 'right bottom',
                    backgroundSize: 180, */
                }}
            >
                <Trash weight="fill" />
            </button>
        )
    }

    return(
        <button
            type="button"
            className="p-2 bg-zinc-800 rounded-md border-transparent hover: bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-yellow-500"
            onClick={handleTakeScreenShot}
           >
            {isTakingSecreenShot ? <Loading /> : <Camera className="w-6 h-6"/> }
                

        </button>

    )
}