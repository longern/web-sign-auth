export interface Socket extends EventTarget {
  send(data: string): void;
  close(): void;
}

const DEFAULT_SIGNAL_ENDPOINT =
  process.env.REACT_APP_DEFAULT_SIGNAL_ENDPOINT ||
  `wss://${window.location.host}/signal`;

function waitIceGathering(peer: RTCPeerConnection, timeout = 1000) {
  return new Promise<RTCSessionDescription>((resolve) => {
    setTimeout(function () {
      resolve(peer.localDescription);
    }, timeout);
    peer.onicegatheringstatechange = () =>
      peer.iceGatheringState === "complete" && resolve(peer.localDescription);
  });
}

function randomHex(length: number) {
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  const toHex = (b: number) => b.toString(16).padStart(2, "0");
  return Array.from(randomValues).map(toHex).join("");
}

function dataChannelEventProxy(
  dataChannel: RTCDataChannel,
  target: EventTarget
) {
  dataChannel.onmessage = (event) => {
    target.dispatchEvent(new MessageEvent("message", { data: event.data }));
  };
  dataChannel.onerror = (event: RTCErrorEvent) => {
    // https://datatracker.ietf.org/doc/html/rfc4960#section-3.3.10
    // User Initiated Abort
    if (event.error.sctpCauseCode === 12) return dataChannel.close();

    target.dispatchEvent(new ErrorEvent("error", { error: event.error }));
  };
  dataChannel.onclose = () => {
    target.dispatchEvent(new CloseEvent("close"));
  };
  target.dispatchEvent(new Event("open"));
}

export class PeerSocket extends EventTarget implements Socket {
  private peer: RTCPeerConnection;
  private dataChannel: RTCDataChannel;

  constructor(
    id?: string,
    options?: { rtcConfiguration?: RTCConfiguration; endpoint?: string }
  ) {
    super();

    if (typeof id !== "string") return;

    options = options || {};
    const { endpoint = DEFAULT_SIGNAL_ENDPOINT, rtcConfiguration } = options;

    const peer = new RTCPeerConnection(rtcConfiguration);
    this.peer = peer;
    this.dataChannel = peer.createDataChannel("dataChannel");
    peer.createOffer().then(async (offer) => {
      await peer.setLocalDescription(offer);
      const { sdp } = await waitIceGathering(peer);
      let signalSocket = new WebSocket(endpoint);
      signalSocket.onopen = () => {
        const peerId = randomHex(16);
        const messages = [
          { type: "createTopic", name: peerId },
          { type: "consume", topic: peerId },
          {
            type: "produce",
            topic: id,
            message: JSON.stringify({ type: "offer", peerId, offer: sdp }),
          },
        ];
        for (const message of messages)
          signalSocket.send(JSON.stringify(message));
      };
      signalSocket.onmessage = async (event) => {
        const body = JSON.parse(event.data);

        if (body.type === "error") {
          if (body.data === "Topic not found") {
            this.dispatchEvent(
              new ErrorEvent("error", { error: new Error("Room not found.") })
            );
          }
          return;
        }

        if (body.type !== "message") return;
        const message = JSON.parse(body.data);
        switch (message.type) {
          case "answer":
            await peer.setRemoteDescription({
              type: "answer",
              sdp: message.answer,
            });
            signalSocket.send(JSON.stringify({ type: "consume" }));
            break;
        }
      };
      signalSocket.onerror = () => {
        this.dispatchEvent(
          new ErrorEvent("error", {
            error: new Error("Failed to connect to the signaling server."),
          })
        );
      };
      peer.addEventListener("connectionstatechange", () => {
        if (
          peer.connectionState === "failed" ||
          peer.connectionState === "disconnected"
        ) {
          this.dispatchEvent(
            new ErrorEvent("error", {
              error: new Error(`Connection ${peer.connectionState}.`),
            })
          );
        }
      });
      peer.addEventListener("close", () => {
        signalSocket.close();
      });
    });
    this.dataChannel.onopen = () => {
      dataChannelEventProxy(this.dataChannel, this);
    };
    this.dataChannel.onclose = () => this.close();
  }

  send(data: string) {
    this.dataChannel.send(data);
  }

  close() {
    this.dataChannel.close();
    this.peer.close();
  }

  static from(peer: RTCPeerConnection) {
    const peerSocket = new PeerSocket();
    peerSocket.peer = peer;
    peer.ondatachannel = (event) => {
      peerSocket.dataChannel = event.channel;
      dataChannelEventProxy(peerSocket.dataChannel, peerSocket);
    };
    return peerSocket;
  }
}

export class PeerServer extends EventTarget {
  endpoint: string;
  config: RTCConfiguration;
  abortController: AbortController;

  constructor(options?: {
    rtcConfiguration?: RTCConfiguration;
    endpoint?: string;
  }) {
    super();

    options = options || {};
    this.endpoint = options.endpoint || DEFAULT_SIGNAL_ENDPOINT;
    this.config = options.rtcConfiguration;
    this.abortController = new AbortController();
  }

  bind(id: string) {
    const signalSocket = new WebSocket(this.endpoint);
    signalSocket.onopen = () => {
      signalSocket.send(JSON.stringify({ type: "createTopic", name: id }));
      signalSocket.send(JSON.stringify({ type: "consume", topic: id }));
      this.dispatchEvent(new Event("open"));
    };
    signalSocket.onmessage = async (event: MessageEvent<string>) => {
      const body = JSON.parse(event.data);
      if (body.type !== "message") return;
      const message = JSON.parse(body.data);
      switch (message.type) {
        case "offer":
          let peer = new RTCPeerConnection(this.config);
          await peer.setRemoteDescription({
            type: "offer",
            sdp: message.offer,
          });
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          const { sdp } = await waitIceGathering(peer);
          if (this.abortController.signal.aborted) return;
          const peerSocket = PeerSocket.from(peer);
          signalSocket.send(
            JSON.stringify({
              type: "produce",
              topic: message.peerId,
              message: JSON.stringify({ type: "answer", answer: sdp }),
            })
          );
          this.dispatchEvent(
            new CustomEvent("connection", { detail: peerSocket })
          );
          break;
      }
    };

    this.abortController.signal.addEventListener("abort", () => {
      if (signalSocket.readyState === WebSocket.CONNECTING) {
        signalSocket.onopen = () => signalSocket.close();
      } else {
        signalSocket.close();
      }
    });
  }

  close() {
    this.abortController.abort();
  }
}
