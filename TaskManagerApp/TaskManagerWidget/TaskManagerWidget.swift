import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), displayString: "Start your day")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), displayString: "Focus on tasks")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        let currentDate = Date()
        
        // Improve timeline generation to show something meaningful
        let entry = SimpleEntry(date: currentDate, displayString: "Review pending tasks")
        entries.append(entry)

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let displayString: String
}

struct TaskManagerWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading) {
            Text("Tasks")
                .font(.headline)
            
            Divider()
            
            HStack {
                Circle()
                    .fill(Color.green)
                    .frame(width: 8, height: 8)
                Text(entry.displayString)
                    .font(.body)
                    .lineLimit(1)
            }
            .padding(.top, 4)
            
            Spacer()
        }
        .padding()
    }
}

struct TaskManagerWidget: Widget {
    let kind: String = "TaskManagerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(macOS 14.0, *) {
                TaskManagerWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                TaskManagerWidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("Daily Tasks")
        .description("Shows your current top tasks.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#Preview(as: .systemSmall) {
    TaskManagerWidget()
} timeline: {
    SimpleEntry(date: .now, displayString: "Code Review")
    SimpleEntry(date: .now, displayString: "Team Meeting")
}
