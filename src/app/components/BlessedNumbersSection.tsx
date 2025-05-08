'use client';
import { BlessedNumber } from '../types/tickets';

interface BlessedNumbersSectionProps {
  blessedNumbers: BlessedNumber[];
  onNumberClaimed?: (number: BlessedNumber) => void;
}

export function BlessedNumbersSection({ blessedNumbers }: BlessedNumbersSectionProps) {

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
            w-16 h-16 flex items-center justify-center rounded-lg border-2 transition shadow-md
            ${number.claimed
                ? 'border-gray-300 bg-gray-100 opacity-60'
                : `
                bg-gradient-to-tr from-[#d4d4d4] via-[#f0f0f0] to-[#c0c0c0]
                border-[#a0a0a0]
                hover:from-[#f5f5f5] hover:to-white
                cursor-pointer
              `}
          `}
            onClick={() => {

            }}
          >
            <span className={`
            text-xl font-bold
            ${number.claimed ? 'line-through text-gray-400' : 'text-gray-700 drop-shadow-sm'}
          `}>
              {number.value.toString().padStart(5, '0')}
            </span>
          </div>

        ))}
      </div>

    </section>
  );
}