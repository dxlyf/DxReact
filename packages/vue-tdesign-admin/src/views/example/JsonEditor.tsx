import { defineComponent, ref, reactive, toRefs } from 'vue'

// 定义属性类型
type PropertyType = 'string' | 'number' | 'boolean' | 'array' | 'object'

// 定义属性接口
interface Property {
  id: string
  name: string
  type: PropertyType
  value: any
  items?: Property[] // 用于array类型
  properties?: Property[] // 用于object类型
}

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9)

// 类型选择器组件
const TypeSelector = {
  props: ['modelValue', 'onUpdateModelValue'],
  setup(props: any) {
    const types: PropertyType[] = ['string', 'number', 'boolean', 'array', 'object']
    return () => (
      <select 
        class="border rounded px-2 py-1 text-sm" 
        value={props.modelValue}
        onChange={(e) => props.onUpdateModelValue(e.target.value)}
      >
        {types.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
    )
  }
}

// 基础类型编辑器组件
const BasicTypeEditor = {
  props: ['property', 'onUpdateProperty'],
  setup(props: any) {
    const { property } = props
    
    const updateValue = (value: any) => {
      props.onUpdateProperty({
        ...property,
        value
      })
    }
    
    return () => {
      switch (property.type) {
        case 'string':
          return (
            <input 
              type="text" 
              class="border rounded px-2 py-1 text-sm flex-1" 
              value={property.value || ''}
              onChange={(e) => updateValue(e.target.value)}
            />
          )
        case 'number':
          return (
            <input 
              type="number" 
              class="border rounded px-2 py-1 text-sm flex-1" 
              value={property.value || 0}
              onChange={(e) => updateValue(Number(e.target.value))}
            />
          )
        case 'boolean':
          return (
            <input 
              type="checkbox" 
              class="mr-2" 
              checked={property.value || false}
              onChange={(e) => updateValue(e.target.checked)}
            />
          )
        default:
          return null
      }
    }
  }
}

// 数组编辑器组件
const ArrayEditor = {
  props: ['property', 'onUpdateProperty'],
  setup(props: any) {
    const { property } = props
    const displayStyle = ref('list') // list 或 tabs
    
    const addItem = () => {
      const newItem: Property = {
        id: generateId(),
        name: `item_${(property.items?.length || 0) + 1}`,
        type: 'string',
        value: ''
      }
      const updatedItems = [...(property.items || []), newItem]
      props.onUpdateProperty({
        ...property,
        items: updatedItems
      })
    }
    
    const removeItem = (id: string) => {
      const updatedItems = (property.items || []).filter(item => item.id !== id)
      props.onUpdateProperty({
        ...property,
        items: updatedItems
      })
    }
    
    const clearAll = () => {
      props.onUpdateProperty({
        ...property,
        items: []
      })
    }
    
    const updateItem = (updatedItem: Property) => {
      const updatedItems = (property.items || []).map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
      props.onUpdateProperty({
        ...property,
        items: updatedItems
      })
    }
    
    return () => (
      <div class="w-full">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center">
            <label class="mr-2 text-sm">展示风格:</label>
            <select 
              class="border rounded px-2 py-1 text-sm" 
              value={displayStyle.value}
              onChange={(e) => displayStyle.value = e.target.value}
            >
              <option value="list">列表</option>
              <option value="tabs">选项卡</option>
            </select>
          </div>
          <div class="flex gap-2">
            <t-button size="small" onClick={addItem}>添加项</t-button>
            <t-button size="small" theme="danger" onClick={clearAll}>清空</t-button>
          </div>
        </div>
        
        {displayStyle.value === 'list' ? (
          <div class="border rounded p-2">
            {(property.items || []).map((item, index) => (
              <div key={item.id} class="flex items-center gap-2 mb-2 last:mb-0 p-2 border rounded bg-white">
                <div class="text-sm font-medium w-16">项 {index + 1}:</div>
                <TypeSelector 
                  modelValue={item.type}
                  onUpdateModelValue={(type: PropertyType) => updateItem({ ...item, type })}
                />
                <BasicTypeEditor 
                  property={item}
                  onUpdateProperty={updateItem}
                />
                <t-button size="small" theme="danger" onClick={() => removeItem(item.id)}>删除</t-button>
              </div>
            ))}
          </div>
        ) : (
          <div class="border rounded p-2">
            <div class="flex border-b">
              {(property.items || []).map((item, index) => (
                <div 
                  key={item.id} 
                  class="px-4 py-2 cursor-pointer border-b-2 border-blue-500"
                >
                  项 {index + 1}
                </div>
              ))}
            </div>
            <div class="p-2">
              {(property.items || []).map((item) => (
                <div key={item.id} class="p-2 border rounded bg-white">
                  <TypeSelector 
                    modelValue={item.type}
                    onUpdateModelValue={(type: PropertyType) => updateItem({ ...item, type })}
                  />
                  <BasicTypeEditor 
                    property={item}
                    onUpdateProperty={updateItem}
                  />
                  <t-button size="small" theme="danger" onClick={() => removeItem(item.id)}>删除</t-button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
}

// 对象编辑器组件
const ObjectEditor = {
  props: ['property', 'onUpdateProperty'],
  setup(props: any) {
    const { property } = props
    
    const addProperty = () => {
      const newProp: Property = {
        id: generateId(),
        name: `property_${(property.properties?.length || 0) + 1}`,
        type: 'string',
        value: ''
      }
      const updatedProps = [...(property.properties || []), newProp]
      props.onUpdateProperty({
        ...property,
        properties: updatedProps
      })
    }
    
    const removeProperty = (id: string) => {
      const updatedProps = (property.properties || []).filter(prop => prop.id !== id)
      props.onUpdateProperty({
        ...property,
        properties: updatedProps
      })
    }
    
    const updateProperty = (updatedProp: Property) => {
      const updatedProps = (property.properties || []).map(prop => 
        prop.id === updatedProp.id ? updatedProp : prop
      )
      props.onUpdateProperty({
        ...property,
        properties: updatedProps
      })
    }
    
    return () => (
      <div class="w-full">
        <div class="flex justify-end mb-2">
          <t-button size="small" onClick={addProperty}>添加属性</t-button>
        </div>
        <div class="border rounded p-2">
          {(property.properties || []).map((prop) => (
            <div key={prop.id} class="flex items-center gap-2 mb-2 last:mb-0 p-2 border rounded bg-white">
              <input 
                type="text" 
                class="border rounded px-2 py-1 text-sm w-24" 
                value={prop.name}
                onChange={(e) => updateProperty({ ...prop, name: e.target.value })}
              />
              <TypeSelector 
                modelValue={prop.type}
                onUpdateModelValue={(type: PropertyType) => updateProperty({ ...prop, type })}
              />
              <BasicTypeEditor 
                property={prop}
                onUpdateProperty={updateProperty}
              />
              <t-button size="small" theme="danger" onClick={() => removeProperty(prop.id)}>删除</t-button>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

// 通用值编辑器组件
const ValueEditor = {
  props: ['property', 'onUpdateProperty'],
  setup(props: any) {
    const { property } = toRefs(props)
    
    return () => {
      console.log(property.value.type)
      switch (property.value.type) {
        case 'string':
        case 'number':
        case 'boolean':
          return <BasicTypeEditor property={property.value} onUpdateProperty={props.onUpdateProperty} />
        case 'array':
          return <ArrayEditor property={property.value} onUpdateProperty={props.onUpdateProperty} />
        case 'object':
          return <ObjectEditor property={property.value} onUpdateProperty={props.onUpdateProperty} />
        default:
          return null
      }
    }
  }
}

export default defineComponent({
  name: 'JsonEditor',
  setup() {
    const properties = reactive<Property[]>([])
    
    const addProperty = () => {
      const newProperty: Property = {
        id: generateId(),
        name: `property_${properties.length + 1}`,
        type: 'string',
        value: ''
      }
      properties.push(newProperty)
    }
    
    const removeProperty = (id: string) => {
      const index = properties.findIndex(prop => prop.id === id)
      if (index !== -1) {
        properties.splice(index, 1)
      }
    }
    
    const updateProperty = (updatedProperty: Property) => {
      const index = properties.findIndex(prop => prop.id === updatedProperty.id)
      if (index !== -1) {
        properties[index] = updatedProperty
      }
    }
    
    return () => {
      return (
        <div class="flex flex-col bg-gray-100 p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">技术规格编辑</h2>
            <t-button onClick={addProperty}>添加属性</t-button>
          </div>
          
          <div class="space-y-4">
            {properties.map((property) => (
              <div key={property.id} class="border rounded p-4 bg-white">
                <div class="flex items-center gap-4 mb-4">
                  <input 
                    type="text" 
                    class="border rounded px-3 py-2 text-sm w-32" 
                    value={property.name}
                    onChange={(e) => updateProperty({ ...property, name: e.target.value })}
                    placeholder="属性名称"
                  />
                  <TypeSelector 
                    modelValue={property.type}
                    onUpdateModelValue={(type: PropertyType) => updateProperty({ ...property, type })}
                  />
                  <t-button theme="danger" onClick={() => removeProperty(property.id)}>删除属性</t-button>
                </div>
                
                <ValueEditor 
                  property={property}
                  onUpdateProperty={updateProperty}
                />
              </div>
            ))}
          </div>
          
          {properties.length === 0 && (
            <div class="text-center py-8 text-gray-500">
              暂无属性，请点击"添加属性"按钮添加
            </div>
          )}
        </div>
      )
    }
  }
})