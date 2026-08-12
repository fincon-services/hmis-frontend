import { Descriptions } from 'antd';

export interface DetailField {
  label: string;
  value: React.ReactNode;
  span?: number;
}

export function DetailCard({ fields, column = 2 }: { fields: DetailField[]; column?: number }) {
  return (
    <Descriptions column={column} bordered size="small">
      {fields.map((field, i) => (
        <Descriptions.Item key={i} label={field.label} span={field.span}>
          {field.value ?? '—'}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
}
