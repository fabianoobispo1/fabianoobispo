'use client'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { ptBR } from 'date-fns/locale'

import { cn } from '@/lib/utils'

import { Calendar } from './calendar'
import { FormItem } from '../ui/form'
import { Label } from '../ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'

interface DatePickerWithDefaultsProps {
  label: string
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DatePickerWithDefaults({
  label,
  date,
  setDate,
}: DatePickerWithDefaultsProps) {
  return (
    <FormItem className="flex flex-col gap-2">
      <Label id="datepicker-default-range-v9">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
            aria-labelledby="datepicker-default-range-v9"
          >
            <CalendarIcon className="mr-2 size-4" />
            {date ? (
              format(date, 'PPP', { locale: ptBR })
            ) : (
              <span>Selecione</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            showOutsideDays={true}
          />
        </PopoverContent>
      </Popover>
    </FormItem>
  )
}
