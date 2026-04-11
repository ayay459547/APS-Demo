export interface FeatureCardProps {
  id: string
  label: string
  icon: React.ElementType
  to: string
  description: string
  tag?: string
  tagColor?: string
  isNew?: boolean
}
