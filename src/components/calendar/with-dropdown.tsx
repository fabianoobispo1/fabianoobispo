'use client'
import { format } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { ptBR } from 'date-fns/locale'

import { cn } from '@/lib/utils'

import { Calendar } from './calendar'
import MonthAndYearDropdown from './month-year-dropdown'
import { FormItem, FormMessage } from '../ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Label } from '../ui/label'

interface DatePickerWithDropdownProps {
  label: string
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DatePickerWithDropdown({
  label,
  date,
  setDate,
}: DatePickerWithDropdownProps) {
  return (
    <FormItem className="flex flex-col gap-2">
      <Label id="datepicker-month-year-dropdown-v9">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full  justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
            aria-labelledby="datepicker-month-year-dropdown-v9"
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
            disabled={(date) =>
              date > new Date() || date < new Date('1900-01-01')
            }
            locale={ptBR}
            mode="single"
            captionLayout="dropdown"
            selected={date}
            onSelect={setDate}
            showOutsideDays={true}
            endMonth={new Date(2099, 11)}
            components={{
              Dropdown: MonthAndYearDropdown,
              Chevron: ({ orientation }) =>
                orientation === 'left' ? (
                  <ChevronLeft className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                ),
            }}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )
}
