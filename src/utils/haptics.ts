import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
    seleccion() {
        try {
            Haptics.selectionAsync();
        } catch {}
    },

    exito(){
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        } catch {}
    },

    error() {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        } catch {}
    },

    impactoMedio() {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        } catch {}
    }
}