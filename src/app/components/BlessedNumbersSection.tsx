// components/BlessedNumbersSection.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TicketOption, BlessedNumber } from '../types/tickets';

interface BlessedNumbersSectionProps {
  blessedNumbers: BlessedNumber[];
  onNumberClaimed?: (number: BlessedNumber) => void;
}

export function BlessedNumbersSection({ blessedNumbers, onNumberClaimed }: BlessedNumbersSectionProps) {

  return (
    <section className="w-full my-8 px-4">
      <h2 className="text-2xl font-semibold mb-4 text-center">Números Bendecidos</h2>
      <p className="text-center mb-6">
        Gana 200$ si te toca un número bendecido.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {blessedNumbers.map((number) => (
          <div
            key={number.id}
            className={`
              w-16 h-16 flex items-center justify-center rounded-lg border-2 
              ${number.claimed
                ? 'border-gray-300 bg-gray-100 opacity-60'
                : 'border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer transition shadow-sm hover:shadow'}
            `}
            onClick={() => {}}
          >
            <span className={`text-xl font-bold ${number.claimed ? 'line-through text-gray-500' : 'text-green-600'}`}>
              {number.value.toString().padStart(4, '0')}
            </span>
          </div>
        ))}
      </div>

    </section>
  );
}