import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Type, Heading1, Heading2, Heading3, List, CheckSquare, Minus, Table as TableIcon } from 'lucide-react';

const icons: Record<string, any> = {
    Text: Type,
    H1: Heading1,
    H2: Heading2,
    H3: Heading3,
    Ul: List,
    ListTodo: CheckSquare,
    Divider: Minus,
    Table: TableIcon,
};

export const SlashMenu = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (!props.items.length) {
        return null;
    }

    return (
        <div className="bg-white/80 backdrop-blur-[20px] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#e5e5ea]/50 flex flex-col p-1.5 w-64 overflow-hidden text-sm z-50">
            <div className="px-2 py-1 text-[11px] text-gray-400 font-semibold mb-1 uppercase tracking-widest">Blocks</div>
            {props.items.map((item: any, index: number) => {
                const Icon = icons[item.icon];
                return (
                    <button
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${index === selectedIndex ? 'bg-black/5 text-gray-900 font-medium' : 'text-gray-600 hover:bg-black/[0.03]'
                            }`}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        {Icon && <Icon size={16} strokeWidth={1.5} className={index === selectedIndex ? 'text-gray-900' : 'text-gray-400'} />}
                        <span>{item.title}</span>
                    </button>
                );
            })}
        </div>
    );
});
