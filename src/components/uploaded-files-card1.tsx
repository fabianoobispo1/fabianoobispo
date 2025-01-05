'use client'
import Image from 'next/image'
import { Trash } from 'lucide-react'

import type { UploadedFile } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface UploadedFilesCardProps {
  uploadedFiles: UploadedFile[]
  setUploadedFiles: (files: UploadedFile[]) => void
}

export function UploadedFilesCard1({
  uploadedFiles,
  setUploadedFiles,
}: UploadedFilesCardProps) {
  const { toast } = useToast()

  async function removeFileFromUploadthing(fileKey: string) {
    const imageKey = fileKey.substring(fileKey.lastIndexOf('/') + 1)

    fetch('/api/uploadthing/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageKey }),
    })
      .then(async (res) => {
        if (res.ok) {
          toast({
            variant: 'default',
            description: 'Imagem removida.',
          })
          setUploadedFiles([])
        } else {
          const errorData = await res.json()
          toast({
            variant: 'destructive',
            description: errorData.message || 'Something went wrong',
          })
        }
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          description: 'Something went wrong',
        })
      })
      .finally(() => {})
  }

  if (uploadedFiles.length > 0) {
    return (
      <ScrollArea className="pb-4">
        <div className="flex w-max space-x-2.5">
          {uploadedFiles.map((file) => (
            <div key={file.key} className="relative aspect-video w-80">
              <Image
                src={file.url}
                alt={file.name}
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                loading="lazy"
                className="rounded-md object-cover"
              />
              <button
                onClick={() => removeFileFromUploadthing(file.key)} // Chama callback ao clicar
                className="absolute top-2 right-2 rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
              >
                <Trash className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    )
  } else {
    return <></>
  }
}
