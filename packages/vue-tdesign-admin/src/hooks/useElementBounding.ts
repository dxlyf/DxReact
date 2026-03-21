import { ref, reactive, onMounted, onUnmounted, watch, type Ref, unref } from 'vue';

export interface ElementBounding {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
  x: number;
  y: number;
}

export interface UseElementBoundingOptions {
  reset?: boolean;
  windowResize?: boolean;
  windowScroll?: boolean;
  immediate?: boolean;
}

const defaultBounding: ElementBounding = {
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  x: 0,
  y: 0,
};

export function useElementBounding(
  target: Ref<HTMLElement | null | undefined> | HTMLElement | null | undefined,
  options: UseElementBoundingOptions = {},
) {
  const {
    reset = true,
    windowResize = true,
    windowScroll = true,
    immediate = true,
  } = options;

  const bounding = reactive<ElementBounding>({ ...defaultBounding });
  const isSupported = ref(false);

  if (typeof window !== 'undefined') {
    isSupported.value = 'getBoundingClientRect' in (window.Element.prototype || {});
  }

  const update = () => {
    const element = unref(target);

    if (!element) {
      if (reset) {
        Object.assign(bounding, defaultBounding);
      }
      return;
    }

    const rect = element.getBoundingClientRect();

    bounding.width = rect.width;
    bounding.height = rect.height;
    bounding.top = rect.top;
    bounding.left = rect.left;
    bounding.right = rect.right;
    bounding.bottom = rect.bottom;
    bounding.x = rect.x;
    bounding.y = rect.y;
  };

  const stopWatch = watch(
    () => unref(target),
    () => {
      update();
    },
    { immediate },
  );

  let resizeObserver: ResizeObserver | null = null;

  const setupResizeObserver = () => {
    const element = unref(target);
    if (!element) return;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(element);
    }
  };

  const cleanupResizeObserver = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  };

  onMounted(() => {
    if (windowResize) {
      window.addEventListener('resize', update);
    }
    if (windowScroll) {
      window.addEventListener('scroll', update, true);
    }

    setupResizeObserver();
    update();
  });

  onUnmounted(() => {
    if (windowResize) {
      window.removeEventListener('resize', update);
    }
    if (windowScroll) {
      window.removeEventListener('scroll', update, true);
    }

    cleanupResizeObserver();
    stopWatch();
  });

  return {
    ...bounding,
    update,
    isSupported,
  };
}
