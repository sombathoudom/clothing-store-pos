import type { ReactNode } from 'react';
import Heading from '@/components/heading';

type Props = {
    title: string;
    description?: string;
    action?: ReactNode;
};

export default function PageHeader({ title, description, action }: Props) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <Heading title={title} description={description} />
            {action}
        </div>
    );
}
