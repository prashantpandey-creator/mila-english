import XCTest

final class MilaUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    func testNativeLearnerJourneyAndLiveTutor() throws {
        XCTAssertTrue(app.staticTexts["Mila"].waitForExistence(timeout: 12))
        XCTAssertTrue(app.buttons["Начать разговор"].exists)
        capture("01-home")

        app.tabBars.buttons["Учиться"].tap()
        XCTAssertTrue(app.staticTexts["КАРМАННЫЕ ФРАЗЫ"].waitForExistence(timeout: 5))
        capture("02-learn")

        app.tabBars.buttons["Говорить"].tap()
        XCTAssertTrue(app.buttons["Начать запись"].waitForExistence(timeout: 5))
        capture("03-speak")

        app.tabBars.buttons["Прогресс"].tap()
        XCTAssertTrue(app.staticTexts["Твой прогресс"].waitForExistence(timeout: 5))
        capture("04-progress")

        app.tabBars.buttons["Mila"].tap()
        let starter = app.buttons["Давай потренируем разговор в кафе"]
        XCTAssertTrue(starter.waitForExistence(timeout: 5))
        starter.tap()

        XCTAssertTrue(app.staticTexts["chat.message.assistant"].waitForExistence(timeout: 210))
        Thread.sleep(forTimeInterval: 2)
        capture("05-live-tutor")
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
