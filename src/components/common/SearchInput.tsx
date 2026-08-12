import { Input } from 'antd';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', style }: SearchInputProps) {
  return (
    <Input
      allowClear
      prefix={<Search size={14} color="#8896a3" />}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 280, ...style }}
    />
  );
}
