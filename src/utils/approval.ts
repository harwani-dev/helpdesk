import { TicketType, HrType, ItType } from "@prisma/client";

export const requiresManagerApproval = (
    ticketType: TicketType,
    hrType?: HrType | null,
    itType?: ItType | null
): boolean => {
    if (ticketType === TicketType.HR && hrType) {
        // HR tickets that require manager approval
        return hrType === HrType.ANY_FORM_OF_LETTER || hrType === HrType.REFERRAL_APPLICATION || hrType === HrType.COURSE_PURCHASE;
    }

    if (ticketType === TicketType.IT && itType) {
        // IT tickets that require manager approval
        return itType === ItType.ADD_RAM || itType === ItType.NEW_MONITOR;
    }

    return false;
};

