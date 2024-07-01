import BreadCrumb from '@/components/breadcrumb';
import TotalizadorFinancas from '@/components/financas/totalizador-financas';
import { ScrollArea } from '@/components/ui/scroll-area';

const breadcrumbItems = [{ title: 'Finanças', link: '/dashboard/financas' }];
export default function page() {
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />
        <div className="grid grid-cols-1 gap-4 ">
          <TotalizadorFinancas />
        </div>

        {/* <CreateProfileOne categories={[]} initialData={null} /> */}
      </div>
    </ScrollArea>
  );
}
