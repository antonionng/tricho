import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatKeyMomentLines,
  formatTimestamp,
  keyMomentsOf,
  parseDuration,
  parseFeed,
  parseKeyMomentLines,
  parseTimestamp,
  parseTranscriptFile,
  quotesInTranscript,
  transcriptMarkers,
  transcriptParagraphs,
} from "./podcast-feed";

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>Trichollective</title>
  <item>
    <title><![CDATA[Episode 2: Scalp & skin]]></title>
    <guid isPermaLink="false">Buzzsprout-222</guid>
    <pubDate>Thu, 01 Oct 2026 08:00:00 +0100</pubDate>
    <enclosure url="https://www.buzzsprout.com/1/222.mp3" length="123" type="audio/mpeg" />
    <itunes:duration>1:02:03</itunes:duration>
    <description><![CDATA[<p>First paragraph.</p><p>Second &amp; last.</p>]]></description>
  </item>
  <item>
    <title>Episode 1: Hello &amp; welcome</title>
    <link>https://share.transistor.fm/s/abc123</link>
    <guid>tr-111</guid>
    <pubDate>Tue, 01 Sep 2026 08:00:00 GMT</pubDate>
    <enclosure type="audio/mpeg" url='https://media.transistor.fm/abc.mp3?x=1&amp;y=2'/>
    <itunes:duration>1534</itunes:duration>
    <description>Plain text</description>
  </item>
  <item><title>No audio</title><guid>g3</guid><itunes:duration>45:10</itunes:duration></item>
</channel>
</rss>`;

describe("parseFeed", () => {
  it("reads each episode from the feed", () => {
    const eps = parseFeed(FEED);
    expect(eps).toHaveLength(3);
    expect(eps[0]).toMatchObject({
      guid: "Buzzsprout-222",
      title: "Episode 2: Scalp & skin",
      audioUrl: "https://www.buzzsprout.com/1/222.mp3",
      durationSec: 3723,
      description: "First paragraph.\n\nSecond & last.",
    });
    expect(eps[0].publishedAt?.toISOString()).toBe("2026-10-01T07:00:00.000Z");
    expect(eps[0].embedUrl).toBeUndefined();
    expect(eps[1]).toMatchObject({
      guid: "tr-111",
      title: "Episode 1: Hello & welcome",
      audioUrl: "https://media.transistor.fm/abc.mp3?x=1&y=2",
      durationSec: 1534,
      embedUrl: "https://share.transistor.fm/e/abc123",
    });
    expect(eps[2]).toMatchObject({ audioUrl: null, durationSec: 2710, publishedAt: null });
  });

  it("returns nothing for a feed without items", () => {
    expect(parseFeed("<rss><channel></channel></rss>")).toEqual([]);
  });
});

describe("durations and timestamps", () => {
  it("reads every itunes:duration format", () => {
    expect(parseDuration("01:02:03")).toBe(3723);
    expect(parseDuration("62:03")).toBe(3723);
    expect(parseDuration("3723")).toBe(3723);
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("soon")).toBeNull();
  });

  it("formats and parses markers", () => {
    expect(formatTimestamp(75)).toBe("01:15");
    expect(formatTimestamp(3723)).toBe("62:03");
    expect(parseTimestamp("62:03")).toBe(3723);
    expect(parseTimestamp("1:02:03")).toBe(3723);
    expect(parseTimestamp("1:75")).toBeNull();
    expect(formatDuration(1500)).toBe("25 min");
    expect(formatDuration(3723)).toBe("1 hr 2 min");
  });

  it("finds markers in a transcript", () => {
    expect([...transcriptMarkers("[00:00] Hi.\n\n[01:15] Next.\n\n[62:03] End.")]).toEqual([0, 75, 3723]);
  });

  it("reads key moment lines and skips bad ones", () => {
    const moments = parseKeyMomentLines("12:30 Pricing a consultation\nnot a moment\n[01:05] - Introductions\n");
    expect(moments).toEqual([
      { t: 65, label: "Introductions" },
      { t: 750, label: "Pricing a consultation" },
    ]);
    expect(formatKeyMomentLines(moments)).toBe("01:05 Introductions\n12:30 Pricing a consultation");
    expect(keyMomentsOf([{ t: 5, label: "a" }, { t: "x" }, null])).toEqual([{ t: 5, label: "a" }]);
    expect(keyMomentsOf(null)).toEqual([]);
  });
});

describe("parseTranscriptFile", () => {
  it("keeps plain text as it is", () => {
    expect(parseTranscriptFile("notes.txt", "﻿Hello.\r\n\r\n\r\nWorld.")).toBe("Hello.\n\nWorld.");
  });

  it("turns WebVTT into paragraphs with markers", () => {
    const vtt = `WEBVTT

NOTE produced by a tool

1
00:00:01.000 --> 00:00:04.000
<v Karley>Welcome to the podcast.

2
00:00:04.500 --> 00:00:07.000
<v Karley>Today we talk about scalps.

00:00:08.000 --> 00:00:10.000
<v Guest>Thanks for having me.

00:01:05.000 --> 00:01:09.000
<v Guest>Let me explain &amp; show.
`;
    expect(parseTranscriptFile("ep.vtt", vtt)).toBe(
      "[00:01] Karley: Welcome to the podcast. Today we talk about scalps.\n\n[00:08] Guest: Thanks for having me.\n\n[01:05] Guest: Let me explain & show."
    );
  });

  it("turns SRT into paragraphs with markers", () => {
    const srt = "1\r\n00:00:02,000 --> 00:00:03,000\r\nHello there.\r\n\r\n2\r\n01:00:00,000 --> 01:00:02,000\r\nGoodbye.\r\n";
    expect(parseTranscriptFile("ep.SRT", srt)).toBe("[00:02] Hello there.\n\n[60:00] Goodbye.");
  });

  it("splits a transcript into paragraphs", () => {
    expect(transcriptParagraphs("a\n\n\nb\n \nc")).toEqual(["a", "b", "c"]);
  });
});

describe("quotesInTranscript", () => {
  const transcript = "[00:10] Guest: I always say, “the scalp is skin”, and it’s true.\n\n[00:20] Refer early, refer often.";

  it("keeps quotes found word for word, ignoring case and punctuation", () => {
    expect(quotesInTranscript(["The scalp is skin, and it's true", "“Refer early, refer often.”"], transcript)).toEqual([
      "The scalp is skin, and it's true",
      "Refer early, refer often.",
    ]);
  });

  it("drops invented, partial-word, duplicate and very short quotes", () => {
    expect(quotesInTranscript(["The scalp is hair", "always say the", "Refer often", "he scalp is skin"], transcript)).toEqual([
      "always say the",
    ]);
    expect(quotesInTranscript(["refer early refer often", "Refer early, refer often"], transcript)).toHaveLength(1);
    expect(quotesInTranscript(["anything at all here"], "")).toEqual([]);
  });
});
