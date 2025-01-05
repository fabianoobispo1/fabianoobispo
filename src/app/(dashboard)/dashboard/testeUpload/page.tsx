'use client'

import { useUploadFile } from '@/hooks/use-upload-file'
import BreadCrumb from '@/components/breadcrumb'
import { FileUploader } from '@/components/file-uploader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UploadedFilesCard } from '@/components/uploaded-files-card'

const breadcrumbItems = [{ title: 'Pefil', link: '/dashboard/perfil' }]
export default function Page() {
  const { onUpload, progresses, uploadedFiles, isUploading } = useUploadFile(
    'imageUploader',
    {
      defaultUploadedFiles: [],
    },
  )

  return (
    <>
      <ScrollArea className="h-full">
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          <BreadCrumb items={breadcrumbItems} />
          {/*       <PerfilUser /> */}
          <FileUploader
            maxFileCount={1}
            maxSize={4 * 1024 * 1024}
            progresses={progresses}
            onUpload={onUpload}
            disabled={isUploading}
          />
        </div>
        <UploadedFilesCard uploadedFiles={uploadedFiles} />
      </ScrollArea>
    </>
  )
}
