'use client'
import BreadCrumb from '@/components/breadcrumb';
import FileDropzone from '@/components/planohmg/FileDropzone';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EditableTable from '@/components/planohmg/EditableTable';
import readXlsx from '@/components/planohmg/readXlsx';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import copyToClipboard from '@/components/planohmg/copyToClipboard';
import downloadCSV from '@/components/planohmg/downloadCSV';

const breadcrumbItems = [{ title: 'PlanoHMG', link: '/dashboard/planohmg' }];

// Defina o tipo para os dados da tabela
type RetornoXlsxType = (string | number)[][];

export default function Page() {
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [xlsxJson, setXlsxJson] = useState<any[] | null>(null);
  const [xlsxJsonLoading, setXlsxJsonLoading] = useState(false);
  const [textErros, setTextErros] = useState("")
  const [showModal, setShowModal] = useState(false); 
  const { toast } = useToast();

  useEffect(() => {
    if (!xlsxFile) return setXlsxJson(null), setTextErros("");

    (async () => {
      try {
        setXlsxJsonLoading(true);
        const retornoXlsxJson:RetornoXlsxType = await readXlsx(xlsxFile);
        

        let error = false
        let textError = ''
        let listadeerros = false

        //verifica arquivo erros que nao deixa nem importar
        //verifica cabeçalho
        if(!error){
          const cabecalhoEsperado= ['ID', 'Work Item Type', 'Title 1', 'Title 2', 'Title 3', 'Description', 'State', 'Assigned To', 'Area Path', 'Iteration Path', 'Tipo de Tarefa', 'Original Estimate']

          retornoXlsxJson[0].map((header, index) => {     
            if (header !== cabecalhoEsperado[index]) {
              error = true;
            }
          })

          error ? textError='A primeira linha do EXCEL deve conter os títulos. Começando por ID': textError=''
         
        }

        
        //verifica primeira linha apos cabeçalho
        retornoXlsxJson[1].map((row,  index) => {
          //verifica ID
          if(!error){       
            if (index == 0 && row == "") {
              error = true;
              textError=' ID do Pai não inserido. '
            }
          }

          //verifica Work Item Type 
          if(!error){       
            if (index == 1 && row == "") {
              error = true;
              textError=' Work Item Type do Pai não inserido. '
            }
          }          
        })


        //passa por todas as celulas, exceto primeira linha 
        retornoXlsxJson.slice(1).map((row, rowIndex) => {          
          row.map((cell, cellIndex) => {

            //verifica area path
            if(!error){       
              if (cellIndex == 8 && cell == "") {
                error = true;
                textError=' Coluna Area Path não informado. Impossível continuar com a importação. '
              }
            }

            //verifica Iteration Path
            if(!error){       
              if (cellIndex == 9 && cell == "") {
                error = true;
                textError=' Coluna Iteration Path não informado. Impossível continuar com a importação. '
              }
            }
          })          
        })

        
        //verifica arquivo erros que deixa importar mas com alertas
        listadeerros = verificaArquivo(retornoXlsxJson)

        if (!error){
          if(listadeerros){    
            setXlsxJson(retornoXlsxJson)
            toast({
              title: 'Erro',
              variant: 'destructive',
              description: "VArquivo importado com resalvas."
            })   
            setXlsxJsonLoading(false);
          }else{
            setXlsxJson(retornoXlsxJson)
            toast({
              title: 'OK',
              description: "Arquivo importado."
            })   
            setXlsxJsonLoading(false);
          }
         
        }else{
          toast({
            title: 'Erro',
            variant: 'destructive',
            description: "VArquivo não importado. '+ textError"
          })   
          setXlsxJsonLoading(false);
          setXlsxJson(null);
          setXlsxFile(null) 
        }
       
      } catch (error) {
        setXlsxJsonLoading(false);
      }
    })();
  }, [xlsxFile ]);


  const handleDataChange = (data: any[]) => {
    setXlsxJson(data);
  };


  function verificaArquivo(array: RetornoXlsxType):boolean{

    setTextErros("")
    let listadeerros = false
    
    let erros = ''
   
    array.slice(1).map((row, rowIndex) => {  

      //verifica e da alerta       
      if ((String(row[1]).toUpperCase() == "Feature".toUpperCase()) &&
          ((String(row[2]) == "") ||
          ((String(row[3]) != "") ||(String(row[4]) != "")))
        ){        
        erros += "Na linha " + String(rowIndex+1) + " o WORK ITEM TYPE pode estar trocado ou não possui TÍTULO. "
        listadeerros = true
      }

      if (String(row[1]) =='' ){
        erros +=  "Na linha " + String(rowIndex+1) + " o Work Item Type não informado. "
        listadeerros = true
      }

      //verifica e altera
      if (String(row[1]).toUpperCase() == 'requirement'.toUpperCase()) {
        row[1] = 'User Story'
      }

      if ((String(row[1]).toUpperCase() == 'task'.toUpperCase()) ||
          (String(row[1]).toUpperCase() == 'user story'.toUpperCase())
        ){
          row[6] = 'New'
        }
    })
    
  
    setTextErros(erros)
    if (xlsxJson && listadeerros ) {   
      toast({
        title: 'Erro',
        variant: 'destructive',
        description: "Verificar erros."
      })   
    }    
    return listadeerros    
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/modelo_carga_homologacao.xlsx'; // caminho relativo ao arquivo na pasta public
    link.download = 'modelo_carga_homologacao.xlsx'; // nome sugerido para o arquivo a ser baixado
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />
        <div className="flex items-start justify-between">
        <Heading title={`Plano Homologação`} description="Descição" />
        </div>

        <ScrollArea className="h-[calc(100vh-220px)] ">
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
            <Button
              disabled = {!xlsxJson || textErros !=""}
              onClick={() =>xlsxJson && downloadCSV(xlsxJson)}
            >
              Gerar aquivo de importação              
            </Button>

            <div className="relative flex w-full flex-col 
                gap-2 rounded border border-solid border-gray-500 p-2 pt-4">
              <div className="absolute -top-2 left-4 rounded-md  bg-slate-400 px-2 text-xs text-white">
                <p >Ajuda</p>
              </div>
          
              <Button 
                onClick={() => handleDownload()}
              >
                Download exemplo XLSX                
              </Button>

              <Button
                onClick={() => setShowModal(true)}
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

           
          


          </div>
          {xlsxJson && (
            <div className="container mx-auto grid w-full items-center gap-4 px-4">

              <EditableTable
                initialData={xlsxJson}
                onDataChange={handleDataChange}
              />

              <div className="flex flex-row gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button                
                         onClick={() => copyToClipboard(JSON.stringify(xlsxJson))}
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
                          onClick={() => verificaArquivo(xlsxJson)}
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

       {/*      <AlertModal
                   isOpen={showModal}
                   onClose={() => setShowModal(false)}
                   onConfirm={()=>{}}
                   loading={true}
            >

            </AlertModal> */}

        </div>
        {/* <Modal showModal={showModal} onClose={() => setShowModal(false)} /> */}
        <ScrollBar orientation="horizontal" hidden />
        </ScrollArea>

      </div>
    </>
  );
}
