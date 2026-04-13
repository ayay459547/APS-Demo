import { Row, Col, Typography } from 'antd'
import { Cpu, Users } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const MDResource: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-slate-700 rounded-full' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['md_resource'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Resource Capacity
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <FeatureCard
              id='machine_center'
              label={COMPONENT_MAP['machine_center'].label}
              to={COMPONENT_MAP['machine_center'].url}
              icon={Cpu}
              description='機台有限產能參數設定，包含換模換線損失、保養日曆與機台群組定義。'
              tag='Finite Capacity'
              tagColor='orange'
            />
          </Col>
          <Col xs={24} md={12}>
            <FeatureCard
              id='labor_skill'
              label={COMPONENT_MAP['labor_skill'].label}
              to={COMPONENT_MAP['labor_skill'].url}
              icon={Users}
              description='班別配置與技能矩陣（Skill Matrix）管理，將人力作為排程的約束條件。'
              tag='Human Capital'
              tagColor='indigo'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default MDResource
