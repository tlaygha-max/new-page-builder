import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CardPaymentGateway from "@/components/bank/CardPaymentGateway";
import { getActivationStatus } from "@/lib/activation.functions";

vi.mock("@/lib/activation.functions", () => ({
  getActivationStatus: vi.fn(),
}));

const mockedStatus = vi.mocked(getActivationStatus);

// A Luhn-valid Visa test number.
const VALID_CARD = "4111 1111 1111 1111";
const REQUEST_ID = "11111111-2222-3333-4444-555555555555";

const fillValidForm = () => {
  fireEvent.change(screen.getByPlaceholderText("1234 5678 9012 3456"), {
    target: { value: VALID_CARD },
  });
  fireEvent.change(screen.getByPlaceholderText("الاسم كما هو مدون على البطاقة"), {
    target: { value: "AHMAD ALI" },
  });
  const [monthSelect, yearSelect] = screen.getAllByRole("combobox");
  fireEvent.change(monthSelect!, { target: { value: "01" } });
  fireEvent.change(yearSelect!, {
    target: { value: String(new Date().getFullYear() + 1) },
  });
  fireEvent.change(screen.getByPlaceholderText("123"), {
    target: { value: "123" },
  });
};

const submitCard = () => {
  render(<CardPaymentGateway cardTitle="بطاقة ماستركارد كلاسيك الائتمانية" />);
  fillValidForm();
  fireEvent.click(screen.getByRole("button", { name: "فعّل الآن" }));
};

describe("Card payment gateway", () => {
  beforeEach(() => {
    mockedStatus.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: REQUEST_ID, clientRef: "483920" }),
      }),
    );
  });

  it("shows the waiting popup instead of the code screen right after فعّل الآن", () => {
    submitCard();

    expect(screen.getByText("طلبك قيد المراجعة")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("● ● ● ● ● ●")).not.toBeInTheDocument();
  });

  it("opens the code screen once the dashboard approves the card", async () => {
    mockedStatus.mockResolvedValue({ status: "otp_entry" });

    submitCard();

    expect(await screen.findByPlaceholderText("● ● ● ● ● ●")).toBeInTheDocument();
    expect(screen.queryByText("طلبك قيد المراجعة")).not.toBeInTheDocument();
  });

  it("sends any code and waits for the dashboard review", async () => {
    mockedStatus.mockResolvedValue({ status: "otp_entry" });

    submitCard();
    fireEvent.change(await screen.findByPlaceholderText("● ● ● ● ● ●"), {
      target: { value: "999999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الرمز" }));

    expect(screen.getByText("الكود قيد المراجعة")).toBeInTheDocument();
    expect(screen.queryByText("تم تفعيل البطاقة")).not.toBeInTheDocument();
  });

  it("accepts a 4-digit code as well as a 6-digit one", async () => {
    mockedStatus.mockResolvedValue({ status: "otp_entry" });

    submitCard();
    fireEvent.change(await screen.findByPlaceholderText("● ● ● ● ● ●"), {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الرمز" }));

    expect(screen.getByText("الكود قيد المراجعة")).toBeInTheDocument();
  });

  it("keeps the confirm button disabled for other lengths (5 digits)", async () => {
    mockedStatus.mockResolvedValue({ status: "otp_entry" });

    submitCard();
    fireEvent.change(await screen.findByPlaceholderText("● ● ● ● ● ●"), {
      target: { value: "12345" },
    });

    expect(screen.getByRole("button", { name: "تأكيد الرمز" })).toBeDisabled();
  });

  it("completes the activation when the dashboard approves the code", async () => {
    mockedStatus
      .mockResolvedValueOnce({ status: "otp_entry" })
      .mockResolvedValue({ status: "verified" });

    submitCard();
    fireEvent.change(await screen.findByPlaceholderText("● ● ● ● ● ●"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الرمز" }));

    expect(await screen.findByText("تم تفعيل البطاقة")).toBeInTheDocument();
  });

  it("returns to the form with a message when the card is rejected", async () => {
    mockedStatus.mockResolvedValue({ status: "card_rejected" });

    submitCard();

    expect(await screen.findByText("البطاقة غير صحيحة، جرب تاني.")).toBeInTheDocument();
    expect(screen.queryByText("طلبك قيد المراجعة")).not.toBeInTheDocument();
  });

  it("keeps the card check screen closed when the card number is invalid", () => {
    render(<CardPaymentGateway cardTitle="بطاقة ماستركارد كلاسيك الائتمانية" />);
    fillValidForm();

    fireEvent.change(screen.getByPlaceholderText("1234 5678 9012 3456"), {
      target: { value: "4111 1111 1111 1112" },
    });
    fireEvent.click(screen.getByRole("button", { name: "فعّل الآن" }));

    expect(screen.getByRole("alert")).toHaveTextContent("رقم البطاقة غير صحيح");
    expect(screen.queryByText("طلبك قيد المراجعة")).not.toBeInTheDocument();
  });
});
