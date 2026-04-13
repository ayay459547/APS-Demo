import { Row, Col, Typography } from 'antd'
import { Zap, GanttChartSquare, Workflow } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const SchedulingTask: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-violet-600 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.4)]' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['sch_task'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Scheduling Execution
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <FeatureCard
              id='sch_run'
              label={COMPONENT_MAP['sch_run'].label}
              to={COMPONENT_MAP['sch_run'].url}
              icon={Workflow}
              description='將已下達工單進行初步派工，根據當前產線負荷進行任務指派。'
              tag='Dispatch'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='sch_gantt'
              label={COMPONENT_MAP['sch_gantt'].label}
              to={COMPONENT_MAP['sch_gantt'].url}
              icon={GanttChartSquare}
              description='全視覺化拖拽操作，即時反映機台佔用與前後工序關聯。'
              tag='Visualization'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='sch_ai'
              label={COMPONENT_MAP['sch_ai'].label}
              to={COMPONENT_MAP['sch_ai'].url}
              icon={Zap}
              description='採用啟發式基因演算法，一鍵尋找滿足交期與成本的最優解。'
              tag='Advanced AI'
              tagColor='purple'
              isNew
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default SchedulingTask
