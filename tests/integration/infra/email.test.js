import email from "infra/email.js";
import orchestrator from "tests/orchestrator";
describe("infra/email.js", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
  });

  beforeEach(async () => {
    await orchestrator.deleteAllEmails();
  });
  test("send()", async () => {
    await email.send({
      from: "CloneTabNews <contato@clonetabnews.com>",
      to: "recipient@example.com",
      subject: "Test Email",
      text: "Test body",
    });

    const sender = "<contato@clonetabnews.com>";
    const recepient = "<recipient@example.com>";
    const subject = "Last email sent";
    const text = "Last email sent body";
    await email.send({
      from: `CloneTabNews ${sender}`,
      to: recepient,
      subject: subject,
      text: text,
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe(sender);
    expect(lastEmail.recipients[0]).toBe(recepient);
    expect(lastEmail.subject).toBe(subject);
    expect(lastEmail.text).toBe("Last email sent body\n");
  });
});
