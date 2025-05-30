import { SetStateAction, useEffect, useRef, useState } from 'react';

import { Pencil, Trash, Eye, Plus, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

function Input({ type, placeholder, value, onChange, className }: any) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`border rounded-lg px-3 py-2 text-sm focus:outline-none ${className}`}
        />
    );
}

function Button({ variant, size, children, className, onClick, disabled }: any) {
    const baseStyles = 'px-4 py-2 rounded focus:outline-none flex items-center gap-1';
    const variantStyles = variant === 'ghost'
        ? 'bg-transparent hover:bg-gray-100'
        : 'bg-blue-500 text-white hover:bg-blue-600';
    const sizeStyles = size === 'sm' ? 'text-sm' : 'text-base';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        >
            {children}
        </button>
    );
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
}

interface Column {
    key: string;
    label: string;
    isStatus?: boolean;
    isBoolean?: boolean;
}

interface TableAction {
    read?: boolean;
    edit?: boolean;
    delete?: boolean;
    create?: boolean;
}

interface DataTableProps {
    title: string;
    data: any[];
    columns: Column[];
    actions?: TableAction;
    filterable?: boolean;
    searchable?: boolean;
    onAction?: {
        onRead?: (item: any) => void;
        onEdit?: (item: any) => void;
        onDelete?: (item: any) => void;
        onCreate?: () => void;
    };
    customActions?: (row: any) => CustomAction[];
}

interface CustomAction {
    label: string;
    onClick: (item: any) => void;
    confirm?: boolean;
}

interface MenuProps {
    row: any;
    customActions?: (row: any) => CustomAction[];
}

function Menu({ row, customActions }: MenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const items = customActions?.(row) ?? [];

    return (
        <div className="relative overflow-visible" ref={ref}>
            <button onClick={() => setOpen((prev) => !prev)} className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border shadow-lg rounded-md z-50">
                    {items.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setOpen(false);
                                if (!action.confirm || confirm(`¿${action.label}?`)) {
                                    action.onClick(row);
                                }
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DataTable({
    title,
    data,
    columns,
    actions = {},
    customActions,
    onAction,
    filterable = false,
    searchable = false,
}: DataTableProps) {
    const [query, setQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const filteredData = searchable
        ? data.filter((row) =>
            columns.some((col) =>
                String(row[col.key] ?? '')
                    .toLowerCase()
                    .includes(query.toLowerCase())
            )
        )
        : data;

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

    const statusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'completado':
                return 'text-green-600 bg-green-100';
            case 'pending':
            case 'pendiente':
                return 'text-yellow-600 bg-yellow-100';
            case 'failed':
            case 'fallido':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const booleanColor = (value: boolean) => {
        return value
            ? 'text-green-600 bg-green-100'
            : 'text-red-600 bg-red-100';
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg">{title}</h2>
                <div className="flex gap-2">
                    {searchable && (
                        <Input
                            type="text"
                            placeholder="Buscar..."
                            className="max-w-xs"
                            value={query}
                            onChange={(e: { target: { value: SetStateAction<string> } }) => {
                                setQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    )}
                    {actions.create && (
                        <Button variant="default" size="sm" onClick={() => onAction?.onCreate?.()}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="h-[250px] max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "py-2 px-3 text-left capitalize text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis",
                                        col.key === 'telefono' ? 'min-w-[120px] max-w-[140px]' : '',
                                        col.key === 'nombre' ? 'min-w-[160px] max-w-[180px]' : '',
                                        col.key === 'orden' ? 'min-w-[180px] max-w-[200px]' : '',
                                        col.key === 'cantidad' || col.key === 'total' ? 'text-right min-w-[60px]' : ''
                                    )}
                                    title={col.label}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {(actions.read || actions.edit || actions.delete) && (
                                <th className="py-2 px-3 text-left capitalize text-sm font-semibold whitespace-nowrap">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions.read || actions.edit || actions.delete ? 1 : 0)}
                                    className="text-center py-4 text-gray-500"
                                >
                                    No se han encontrado registros.
                                </td>
                            </tr>
                        ) : (
                            currentData.map((row, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                "py-2 px-3 text-sm",
                                                col.key === 'telefono' ? 'min-w-[120px] max-w-[140px] truncate overflow-hidden text-ellipsis' : '',
                                                col.key === 'nombre' ? 'min-w-[160px] max-w-[180px] truncate overflow-hidden text-ellipsis' : '',
                                                col.key === 'orden' ? 'min-w-[180px] max-w-[200px] truncate overflow-hidden text-ellipsis' : '',
                                                col.key === 'cantidad' || col.key === 'total' ? 'text-right min-w-[60px] font-mono' : '',
                                                'whitespace-nowrap'
                                            )}
                                        >
                                            {col.isStatus ? (
                                                <span className={cn(
                                                    'px-2 py-1 rounded-full text-xs font-medium',
                                                    statusColor(row[col.key])
                                                )}>
                                                    {row[col.key]}
                                                </span>
                                            ) : col.isBoolean || typeof row[col.key] === 'boolean' ? (
                                                <span className={cn(
                                                    'px-2 py-1 rounded-full text-xs font-medium',
                                                    booleanColor(row[col.key])
                                                )}>
                                                    {row[col.key] ? 'Sí' : 'No'}
                                                </span>
                                            ) : col.key === 'purchased_at' ? (
                                                formatDate(row[col.key])
                                            ) : (
                                                row[col.key]
                                            )}
                                        </td>
                                    ))}
                                    {(actions.read || actions.edit || actions.delete || customActions) ? (
                                        <td className="py-2 px-3">
                                            <div className="relative">
                                                <Menu row={row} customActions={customActions} />
                                            </div>
                                        </td>
                                    ) : null}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-end gap-2 mt-4 text-sm items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4 text-blue-500" />
                    </Button>
                    <span className="px-2 py-1">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="w-4 h-4 text-blue-500" />
                    </Button>
                </div>
            )}
        </div>
    );
}