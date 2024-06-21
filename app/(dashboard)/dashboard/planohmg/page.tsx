'use client'
import BreadCrumb from '@/components/breadcrumb';
import FileUpload from '@/components/file-upload';
import FileDropzone from '@/components/planohmg/FileDropzone';
import { Heading } from '@/components/ui/heading';
import { useState } from 'react';
import { UploadFileResponse } from 'uploadthing/client';

interface ImageUploadProps {
  onChange?: any;
  onRemove: (value: UploadFileResponse[]) => void;
  value: UploadFileResponse[];
}


const breadcrumbItems = [{ title: 'PlanoHMG', link: '/dashboard/planohmg' }];
export default function page() {
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [xlsxJson, setXlsxJson] = useState<any[] | null>(null);
  const [xlsxJsonLoading, setXlsxJsonLoading] = useState(false);


  const onUpdateFile = (newFiles: UploadFileResponse[]) => {
   
  };
  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />
        <div className="flex items-start justify-between">
        <Heading title={`Plano Homologação`} description="Descição" />
        </div>

        <div className="flex flex-row items-start justify-start gap-2">
          <div className="flex flex-col gap-4 ">
          <FileDropzone
                name="excel-file-input"
                title="Arquivo XLSX"
                description="Selecione um arquivo."
                file={xlsxFile}
                loading={xlsxJsonLoading}
                onDelete={() => setXlsxFile(null)}
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files){
                    return;
                  } else {
                    const fileExtension = files[0].name.split('.').pop();
                    if (fileExtension === 'xlsx') {                    
                      return setXlsxFile(files[0]);
                    } else {
                      setXlsxFile(null)
                      /* toast.error('Arquivo inválido.')    */                  
                    }                  
                  }              
                }}
              />


            botao
          </div>

        </div>
      </div>
    </>
  );
}
