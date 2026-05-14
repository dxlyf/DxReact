import { unref, toValue, type MaybeRefOrGetter, computed, shallowReactive } from 'vue'
import type { DrawerProps } from 'tdesign-vue-next'

export type UseDrawerProps = {
    onConfirm?: (data: any) => void
    onCancel?: () => void
} & Partial<DrawerProps>

export const useDrawer = (props: () => UseDrawerProps) => {
    const state = shallowReactive({
        visible: false,
        data: null
    })

    const open = (data: any = null) => {
        state.visible = !state.visible
        state.data = data
    }

    const close = () => {
        state.data = null
        state.visible = false
    }

    const handleCancel = () => {
        close()
    }


    const drawerProps = computed(() => {
        const {
            ...restDrawerProps
        } = toValue(props)

        return {
            attach: 'body',
            visible: state.visible,
            closeOnEscKeydown: false,
            closeOnOverlayClick: false,
            closeBtn: false,
            destroyOnClose: true,
            onCancel: handleCancel,
            onClose: handleCancel,
            ...restDrawerProps
        } as DrawerProps
    })

    return [drawerProps, { open, close }] as const
}
