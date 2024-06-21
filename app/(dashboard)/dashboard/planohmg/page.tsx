'use client'
import * as z from 'zod';
import BreadCrumb from '@/components/breadcrumb';
import FileUpload from '@/components/file-upload';
import FileDropzone from '@/components/planohmg/FileDropzone';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import { UploadFileResponse } from 'uploadthing/client';
import { useToast } from '@/components/ui/use-toast';
import { ButtonIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const breadcrumbItems = [{ title: 'PlanoHMG', link: '/dashboard/planohmg' }];

export default function page() {
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [xlsxJson, setXlsxJson] = useState<any[] | null>(null);
  const [xlsxJsonLoading, setXlsxJsonLoading] = useState(false);
  const [textErros, setTextErros] = useState("")
  const { toast } = useToast();


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
                      toast({
                        title: 'Erro',
                        variant: 'destructive',
                        description: "Arquivo inválido."
                      })
                          
                    }                  
                  }              
                }}
              />


            botao

            <Button
              disabled = {!xlsxJson || textErros !=""}
              onClick={() =>xlsxJson/*  && downloadCSV(xlsxJson) */}
            >
              Gerar aquivo de importação              
            </Button>

            <div className="relative flex w-full flex-col 
                gap-2 rounded border border-solid border-gray-500 p-2 pt-4">
              <div className="absolute -top-2 left-4 rounded-md  bg-slate-400 px-2 text-xs dark:text-white">
                <p >Ajuda</p>
              </div>
          
              <Button 
                /* onClick={() => handleDownload()} */
              >
                Download exemplo XLSX                
              </Button>

              <Button
             /*    onClick={() => setShowModal(true)} */
              >
                Como fazer a importação no Devops
              </Button>


              <Button 
              variant={'link'}>
              <Link href={"https://devops.energisa.com.br/Energisa/"}  target="_blank">
                https://devops.energisa.com.br/Energisa/
              </Link>
              </Button>
            </div>

            {true && (
              <div className="container mx-auto grid w-full items-center gap-4 px-4">

                {/* <EditableTable
                  initialData={xlsxJson}
                  onDataChange={handleDataChange}
                /> */}

                <div className="flex flex-row gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button                
                          /*  onClick={() => copyToClipboard(JSON.stringify(xlsxJson))} */
                        >
                          {/*  Copiar */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            width={25}
                            height={25}
                          >
                            <path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z"></path>
                          </svg>
                        </Button>                        
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copia para área de transferência</p>
                      </TooltipContent>
                    </Tooltip>                                
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button                
                          /*  onClick={() => verificaArquivo(xlsxJson)}*/
                        >
                          {/*  Copiar */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            width={25}
                            height={25}
                          >
                            <path d="M12 4C14.7486 4 17.1749 5.38626 18.6156 7.5H16V9.5H22V3.5H20V5.99936C18.1762 3.57166 15.2724 2 12 2C6.47715 2 2 6.47715 2 12H4C4 7.58172 7.58172 4 12 4ZM20 12C20 16.4183 16.4183 20 12 20C9.25144 20 6.82508 18.6137 5.38443 16.5H8V14.5H2V20.5H4V18.0006C5.82381 20.4283 8.72764 22 12 22C17.5228 22 22 17.5228 22 12H20Z" />
                          </svg>
                        </Button>                        
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Verifica infomações</p>
                      </TooltipContent>
                    </Tooltip>                                
                  </TooltipProvider>


                </div>
              </div>
            )}
          


          </div>



        </div>
      </div>
    </>
  );
}
